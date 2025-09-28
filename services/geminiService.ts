import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MealDay, Ingredient, MealIngredientInfo, OcrResult, MatchedItemPair, PlannerSettings } from '../types';
import { FIREBASE_API_KEY } from '../firebase';

const ai = new GoogleGenAI({ apiKey: FIREBASE_API_KEY });

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
            description: "A meal plan for the specified days.",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "Day of the week in Thai (e.g., 'วันจันทร์')." },
                    breakfast: {
                        type: Type.OBJECT, 
                        properties: { name: { type: Type.STRING, description: "Name of the breakfast meal." } },
                        required: ["name"],
                    },
                    lunch: { 
                        type: Type.OBJECT, 
                        properties: { name: { type: Type.STRING, description: "Name of the lunch meal." } },
                        required: ["name"],
                    },
                    dinner: { 
                        type: Type.OBJECT, 
                        properties: { name: { type: Type.STRING, description: "Name of the dinner meal." } },
                        required: ["name"],
                    },
                },
                required: ["day"], // Only 'day' is strictly required, meals are optional based on the prompt
            },
        },
        shoppingList: {
            type: Type.ARRAY,
            description: "A consolidated and categorized list of all ingredients needed for the week.",
            items: shoppingListItemSchema,
        },
    },
};

const mealIngredientsItemSchema = {
    type: Type.OBJECT,
    properties: {
        mealName: { type: Type.STRING, description: "The name of the meal, it must match a name from the provided meal plan." },
        ingredients: {
            type: Type.ARRAY,
            description: "Array of ingredients for this specific meal.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Ingredient name." },
                    quantity: { type: Type.STRING, description: "Quantity for this specific meal (e.g., '100g', not the total for the week)." }
                },
                required: ["name", "quantity"]
            }
        }
    },
    required: ["mealName", "ingredients"]
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
            type: Type.ARRAY,
            description: "An array of objects, where each object links a meal name to its specific list of ingredients and their quantities for that one meal.",
            items: mealIngredientsItemSchema
        }
    },
    required: ["shoppingList", "mealIngredients"]
};

const receiptItemSchema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            description: "An array of items found on the receipt.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the item purchased." },
                    price: { type: Type.NUMBER, description: "The price of the item." },
                },
                required: ["name", "price"],
            },
        },
    },
    required: ["items"],
};

const matchResultSchema = {
    type: Type.OBJECT,
    properties: {
        matches: {
            type: Type.ARRAY,
            description: "An array of matched pairs between receipt items and shopping list items.",
            items: {
                type: Type.OBJECT,
                properties: {
                    receiptItemName: { type: Type.STRING, description: "The original name of the item from the receipt." },
                    shoppingListItemName: { type: Type.STRING, description: "The name of the corresponding item from the shopping list." },
                },
                required: ["receiptItemName", "shoppingListItemName"],
            },
        },
    },
    required: ["matches"],
};


export const generateInitialMealPlan = async (settings: PlannerSettings): Promise<{ mealPlan: MealDay[], shoppingList: Ingredient[] }> => {
    
    const { dates, meals } = settings;
    if (dates.length === 0 || meals.length === 0) {
        return { mealPlan: [], shoppingList: [] };
    }

    // Format dates to Thai day names
    const dayNames = [...new Set(dates.map(date => date.toLocaleDateString('th-TH', { weekday: 'long' })))];
    
    const mealMap: Record<string, string> = {
        breakfast: 'มื้อเช้า',
        lunch: 'มื้อกลางวัน',
        dinner: 'มื้อเย็น'
    };
    const mealNames = meals.map(m => mealMap[m]).join(', ');

    const prompt = `สร้างแผนการทำอาหารสำหรับ ${dayNames.length} วัน คือ ${dayNames.join(', ')} สำหรับ 2 คน โดยมีเฉพาะ ${mealNames} ในแต่ละวัน เน้นเมนูที่ทำง่ายในคอนโดและไม่ซับซ้อน.
ต้องมั่นใจว่าทุกวันที่ระบุมีเมนูครบตามมื้อที่เลือก.
พร้อมทั้งรายการวัตถุดิบทั้งหมดที่ต้องซื้อสำหรับทุกเมนูในแผน (shopping list) โดยต้องจัดหมวดหมู่วัตถุดิบด้วย (เช่น ผัก, เนื้อสัตว์, เครื่องปรุง, ของแห้ง, อื่นๆ).
สำหรับวัตถุดิบแต่ละรายการใน shopping list ให้เพิ่ม key 'usedIn' ซึ่งเป็น array ของชื่อเมนูอาหารที่ต้องใช้วัตถุดิบนั้นๆ.
จัดรูปแบบผลลัพธ์เป็น JSON object ที่มี key 'mealPlan' และ 'shoppingList'.`;


    try {
        // Dynamically create a schema that only requires the selected meals
        const mealProperties: Record<string, any> = {};
        if (meals.includes('breakfast')) mealProperties.breakfast = { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ["name"] };
        if (meals.includes('lunch')) mealProperties.lunch = { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ["name"] };
        if (meals.includes('dinner')) mealProperties.dinner = { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ["name"] };

        const dynamicMealPlanSchema = { ...mealPlanSchema };
        // @ts-ignore
        dynamicMealPlanSchema.properties.mealPlan.items.properties = { day: { type: Type.STRING }, ...mealProperties };
        // @ts-ignore
        dynamicMealPlanSchema.properties.mealPlan.items.required = ["day", ...meals];


        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dynamicMealPlanSchema,
            },
        });
        
        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);

        // Ensure the plan only contains the requested days in the correct order
        const orderedPlan = dayNames.map(dayName => {
            const foundDay = (data.mealPlan || []).find((p: MealDay) => p.day === dayName);
            return foundDay || { day: dayName }; // Return a placeholder if AI misses a day
        });

        return {
            mealPlan: orderedPlan,
            shoppingList: (data.shoppingList || []).map((item: Ingredient) => ({...item, checked: false}))
        };
    } catch (error) {
        console.error("Error generating initial meal plan:", error);
        throw new Error("ไม่สามารถสร้างแผนอาหารได้ กรุณาลองใหม่");
    }
};

export const generateShoppingListAndIngredients = async (mealPlan: MealDay[]): Promise<{ shoppingList: Ingredient[], mealIngredients: Record<string, MealIngredientInfo[]> }> => {
    const prompt = `จากแผนการทำอาหารนี้: ${JSON.stringify(mealPlan)}, ซึ่งแต่ละเมนูจะมี key 'servings' เพื่อบอกจำนวนคนที่จะรับประทาน. ให้คำนวณปริมาณวัตถุดิบทั้งหมดสำหรับรายการซื้อของ (shoppingList) และสำหรับแต่ละเมนู (mealIngredients) โดยอิงตามจำนวน 'servings' ที่ระบุ. สูตรอาหารพื้นฐานให้คิดสำหรับ 1 คน.
จากนั้นให้ทำสองอย่าง:
1. สร้างรายการวัตถุดิบทั้งหมดที่ต้องซื้อสำหรับทุกเมนูในสัปดาห์ (shoppingList) โดยรวมปริมาณวัตถุดิบที่ซ้ำกัน พร้อมจัดหมวดหมู่ (เช่น ผัก, เนื้อสัตว์, เครื่องปรุง, ของแห้ง, อื่นๆ) และสำหรับวัตถุดิบแต่ละรายการ ให้เพิ่ม key 'usedIn' ซึ่งเป็น array ของชื่อเมนูอาหารที่ต้องใช้วัตถุดิบนั้นๆ
2. สร้าง array ที่ชื่อว่า mealIngredients โดยแต่ละ object ใน array จะมี key 'mealName' ซึ่งเป็นชื่อเมนูอาหาร และ key 'ingredients' ซึ่งเป็น array ของวัตถุดิบพร้อม "ปริมาณที่ต้องใช้สำหรับเมนูนั้นๆ โดยเฉพาะ" (ไม่ใช่ปริมาณรวม)

จัดรูปแบบผลลัพธ์เป็น JSON object ที่มี key 'shoppingList' และ 'mealIngredients'.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
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
        
        const mealIngredientsArray: { mealName: string; ingredients: MealIngredientInfo[] }[] = data.mealIngredients || [];
        const mealIngredients = mealIngredientsArray.reduce((acc, item) => {
            if (item.mealName && item.ingredients) {
                acc[item.mealName] = item.ingredients;
            }
            return acc;
        }, {} as Record<string, MealIngredientInfo[]>);

        return { shoppingList, mealIngredients };

    } catch (error) {
        console.error("Error generating shopping list and ingredients:", error);
        throw new Error("ไม่สามารถสร้างรายการซื้อของและข้อมูลวัตถุดิบได้ กรุณาลองใหม่");
    }
};

export const processReceiptImage = async (base64Image: string, mimeType: string): Promise<OcrResult[]> => {
    const prompt = "วิเคราะห์รูปภาพใบเสร็จนี้ และดึงข้อมูลรายการสินค้าและราคาออกมา โดยไม่ต้องสนใจข้อมูลอื่นๆ เช่น ยอดรวม, ภาษี, หรือข้อมูลร้านค้า. ผลลัพธ์ต้องเป็น JSON object ที่มี key 'items' ซึ่งเป็น array ของ object โดยแต่ละ object ต้องมี key 'name' (string) และ 'price' (number).";

    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: receiptItemSchema,
            },
        });

        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        return data.items || [];
    } catch (error) {
        console.error("Error processing receipt image:", error);
        throw new Error("ไม่สามารถประมวลผลรูปภาพใบเสร็จได้ กรุณาลองใหม่");
    }
};

export const matchOcrItemsToShoppingList = async (ocrItems: OcrResult[], shoppingListItems: Ingredient[]): Promise<MatchedItemPair[]> => {
    if (ocrItems.length === 0 || shoppingListItems.length === 0) {
        return [];
    }

    const ocrItemNames = ocrItems.map(item => item.name);
    const shoppingListItemNames = shoppingListItems.map(item => item.name);

    const prompt = `คุณคือผู้เชี่ยวชาญในการจับคู่รายการสินค้า
ฉันมีรายการสินค้า 2 ชุด:
1. รายการจากใบเสร็จ (Receipt List)
2. รายการที่ต้องซื้อ (Shopping List)

หน้าที่ของคุณคือจับคู่รายการจาก 'Receipt List' กับรายการใน 'Shopping List' โดยใช้ความเข้าใจเกี่ยวกับสินค้าอุปโภคบริโภคในภาษาไทย ชื่ออาจจะไม่ตรงกันเป๊ะๆ แต่หมายถึงสิ่งเดียวกัน (เช่น 'สันนอกหมู' กับ 'หมูสันนอก' หรือ 'ซีอิ๊วขาว' กับ 'ซอสปรุงรสขาว') ให้จับคู่กันได้

Receipt List: ${JSON.stringify(ocrItemNames)}
Shopping List: ${JSON.stringify(shoppingListItemNames)}

ให้ตอบกลับเป็น JSON object ที่มี key 'matches' ซึ่งเป็น array ของ object ที่จับคู่สำเร็จแล้วเท่านั้น โดยแต่ละ object ต้องมี key 'receiptItemName' (ชื่อเดิมจาก Receipt List) และ 'shoppingListItemName' (ชื่อเดิมจาก Shopping List) ที่ตรงกัน`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: matchResultSchema,
            },
        });
        const jsonString = response.text.trim();
        const data = JSON.parse(jsonString);
        return data.matches || [];
    } catch (error) {
        console.error("Error matching OCR items to shopping list:", error);
        throw new Error("ไม่สามารถจับคู่รายการจากใบเสร็จได้ กรุณาลองใหม่");
    }
};
