import { GoogleGenAI, Type } from "@google/genai";
import { MealDay, Ingredient, MealIngredientInfo } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const shoppingListItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Name of the ingredient." },
        quantity: { type: Type.STRING, description: "Quantity of the ingredient (e.g., '200g', '1 can')." },
        category: { type: Type.STRING, description: "Category of the ingredient in Thai (e.g., 'ผัก', 'เนื้อสัตว์', 'เครื่องปรุง', 'ของแห้ง', 'อื่นๆ')." },
        usedIn: {
            type: Type.ARRAY,
            description: "An array of meal names from the plan that use this specific ingredient.",
            items: { type: Type.STRING }
        }
    },
    required: ["name", "quantity", "category", "usedIn"]
};

const mealPlanSchema = {
    type: Type.OBJECT,
    properties: {
        mealPlan: {
            type: Type.ARRAY,
            description: "A 7-day meal plan.",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "Day of the week in Thai (e.g., 'วันจันทร์')." },
                    lunch: { 
                        type: Type.OBJECT, 
                        properties: { name: { type: Type.STRING, description: "Name of the lunch meal." } },
                        nullable: true
                    },
                    dinner: { 
                        type: Type.OBJECT, 
                        properties: { name: { type: Type.STRING, description: "Name of the dinner meal." } },
                        nullable: true
                    },
                },
            },
        },
        shoppingList: {
            type: Type.ARRAY,
            description: "A consolidated and categorized list of all ingredients needed for the week.",
            items: shoppingListItemSchema,
        },
    },
};

const shoppingListSchema = {
    type: Type.ARRAY,
    description: "A consolidated and categorized list of all ingredients needed for the week.",
    items: shoppingListItemSchema,
};


export const generateInitialMealPlan = async (): Promise<{ mealPlan: MealDay[], shoppingList: Ingredient[] }> => {
    const prompt = `สร้างแผนการทำอาหารสำหรับ 2 สัปดาห์ สำหรับ 2 คน วันละ 2 มื้อ (กลางวันและเย็น) โดยเน้นเมนูที่ทำง่ายในคอนโดและไม่ซับซ้อน พร้อมทั้งรายการวัตถุดิบทั้งหมดที่ต้องซื้อสำหรับทุกเมนูในสัปดาห์นั้นๆ โดยต้องจัดหมวดหมู่วัตถุดิบด้วย (เช่น ผัก, เนื้อสัตว์, เครื่องปรุง, ของแห้ง, อื่นๆ) สำหรับวัตถุดิบแต่ละรายการใน shopping list ให้เพิ่ม key 'usedIn' ซึ่งเป็น array ของชื่อเมนูอาหารที่ต้องใช้วัตถุดิบนั้นๆ จัดรูปแบบผลลัพธ์เป็น JSON object ที่มี key 'mealPlan' และ 'shoppingList'.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: mealPlanSchema,
            },
        });
        
        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        return {
            mealPlan: data.mealPlan || [],
            shoppingList: (data.shoppingList || []).map((item: Ingredient) => ({...item, checked: false}))
        };
    } catch (error) {
        console.error("Error generating initial meal plan:", error);
        throw new Error("ไม่สามารถสร้างแผนอาหารได้ กรุณาลองใหม่");
    }
};

export const regenerateShoppingList = async (mealPlan: MealDay[]): Promise<Ingredient[]> => {
    const prompt = `จากแผนการทำอาหารนี้: ${JSON.stringify(mealPlan)}, สร้างรายการวัตถุดิบทั้งหมดที่ต้องซื้อสำหรับทุกเมนูในสัปดาห์ พร้อมจัดหมวดหมู่วัตถุดิบ (เช่น ผัก, เนื้อสัตว์, เครื่องปรุง, ของแห้ง, อื่นๆ) สำหรับวัตถุดิบแต่ละรายการ ให้เพิ่ม key 'usedIn' ซึ่งเป็น array ของชื่อเมนูอาหารที่ต้องใช้วัตถุดิบนั้นๆ จัดรูปแบบผลลัพธ์เป็น JSON array ของ object ที่มี key 'name', 'quantity', 'category', และ 'usedIn'.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: shoppingListSchema,
            },
        });

        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        return (data || []).map((item: Ingredient) => ({ ...item, checked: false }));
    } catch (error) {
        console.error("Error regenerating shopping list:", error);
        throw new Error("ไม่สามารถสร้างรายการซื้อของได้ กรุณาลองใหม่");
    }
};

export const adaptPlanFromPurchasedIngredients = async (purchasedIngredients: Ingredient[]): Promise<{ mealPlan: MealDay[], mealIngredients: Record<string, MealIngredientInfo[]> }> => {
    const prompt = `
    ฉันได้ซื้อวัตถุดิบมาตามรายการนี้: ${JSON.stringify(purchasedIngredients.map(i => i.name + " " + i.quantity))}.
    
    โปรดสร้างแผนการทำอาหารใหม่สำหรับ 7 วัน (กลางวันและเย็น สำหรับ 2 คน) โดยใช้ *เฉพาะ* วัตถุดิบที่ฉันซื้อมานี้เท่านั้น
    หากวัตถุดิบไม่เพียงพอสำหรับมื้อใด ให้ระบุค่าสำหรับมื้อนั้นเป็น null
    
    นอกจากแผนอาหารแล้ว โปรดสร้าง array ชื่อ 'mealIngredients' โดยแต่ละ object ใน array ต้องมี key 'mealName' (ซึ่งคือชื่อเมนู) และ key 'ingredients' (ซึ่งเป็น array ของวัตถุดิบที่ใช้ในเมนูนั้นๆ พร้อมปริมาณ)
    
    จัดรูปแบบผลลัพธ์เป็น JSON object ที่มี key 'mealPlan' และ 'mealIngredients'
    `;

    const responseSchema = {
         type: Type.OBJECT,
         properties: {
            mealPlan: mealPlanSchema.properties.mealPlan,
            mealIngredients: {
                type: Type.ARRAY,
                description: "A list of meals and their corresponding ingredients.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        mealName: { 
                            type: Type.STRING,
                            description: "The name of the meal." 
                        },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    quantity: { type: Type.STRING }
                                },
                                required: ["name", "quantity"]
                            }
                        }
                    },
                    required: ["mealName", "ingredients"]
                }
            }
         }
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);

        // Transform the array from the API into the dictionary/record format the app uses
        const mealIngredientsArray: { mealName: string; ingredients: MealIngredientInfo[] }[] = data.mealIngredients || [];
        const mealIngredientsMap = mealIngredientsArray.reduce((acc, item) => {
            if (item.mealName) {
                acc[item.mealName] = item.ingredients || [];
            }
            return acc;
        }, {} as Record<string, MealIngredientInfo[]>);

        return {
            mealPlan: data.mealPlan || [],
            mealIngredients: mealIngredientsMap
        };
    } catch (error) {
        console.error("Error adapting plan from purchased ingredients:", error);
        throw new Error("ไม่สามารถปรับแผนอาหารจากของที่ซื้อมาได้ กรุณาลองใหม่");
    }
};