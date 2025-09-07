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
        quantity: { type: Type.STRING, description: "Total quantity of the ingredient for the week (e.g., '200g', '1 can')." },
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

const shoppingListAndIngredientsSchema = {
    type: Type.OBJECT,
    properties: {
        shoppingList: {
            type: Type.ARRAY,
            description: "A consolidated and categorized list of all ingredients needed for the week.",
            items: shoppingListItemSchema,
        },
        mealIngredients: {
            type: Type.OBJECT,
            description: "An object where each key is a unique meal name from the meal plan. The value for each key is an array of ingredients with the specific name and quantity needed for that single meal.",
            additionalProperties: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Ingredient name." },
                        quantity: { type: Type.STRING, description: "Quantity for this specific meal (e.g., '100g', not the total for the week)." }
                    },
                    required: ["name", "quantity"]
                }
            }
        }
    },
    required: ["shoppingList", "mealIngredients"]
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

export const generateShoppingListAndIngredients = async (mealPlan: MealDay[]): Promise<{ shoppingList: Ingredient[], mealIngredients: Record<string, MealIngredientInfo[]> }> => {
    const prompt = `จากแผนการทำอาหารนี้: ${JSON.stringify(mealPlan)}, ให้ทำสองอย่าง:
1. สร้างรายการวัตถุดิบทั้งหมดที่ต้องซื้อสำหรับทุกเมนูในสัปดาห์ (shoppingList) โดยรวมปริมาณวัตถุดิบที่ซ้ำกัน พร้อมจัดหมวดหมู่ (เช่น ผัก, เนื้อสัตว์, เครื่องปรุง, ของแห้ง, อื่นๆ) และสำหรับวัตถุดิบแต่ละรายการ ให้เพิ่ม key 'usedIn' ซึ่งเป็น array ของชื่อเมนูอาหารที่ต้องใช้วัตถุดิบนั้นๆ
2. สร้าง object ที่ชื่อว่า mealIngredients โดยมี key เป็นชื่อเมนูอาหารแต่ละเมนู และ value เป็น array ของวัตถุดิบพร้อม "ปริมาณที่ต้องใช้สำหรับเมนูนั้นๆ โดยเฉพาะ" (ไม่ใช่ปริมาณรวม)

จัดรูปแบบผลลัพธ์เป็น JSON object ที่มี key 'shoppingList' และ 'mealIngredients'.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: shoppingListAndIngredientsSchema,
            },
        });

        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        
        const shoppingList = (data.shoppingList || []).map((item: Ingredient) => ({ ...item, checked: false }));
        const mealIngredients = data.mealIngredients || {};

        return { shoppingList, mealIngredients };

    } catch (error) {
        console.error("Error generating shopping list and ingredients:", error);
        throw new Error("ไม่สามารถสร้างรายการซื้อของและข้อมูลวัตถุดิบได้ กรุณาลองใหม่");
    }
};