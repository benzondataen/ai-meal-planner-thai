import { FIREBASE_PROJECT_ID, FIREBASE_API_KEY } from '../firebase';
import { SavedPlan } from '../types';

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Helper to convert a JavaScript value to Firestore's typed value format
const toFirestoreValue = (value: any): any => {
    if (value === null || value === undefined) {
        return { nullValue: null };
    }
    if (typeof value === 'string') {
        return { stringValue: value };
    }
    if (typeof value === 'boolean') {
        return { booleanValue: value };
    }
    if (typeof value === 'number' && Number.isInteger(value)) {
        return { integerValue: value };
    }
    if (typeof value === 'number') {
        return { doubleValue: value };
    }
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(toFirestoreValue),
            },
        };
    }
    if (typeof value === 'object') {
        const fields: { [key: string]: any } = {};
        for (const key in value) {
            fields[key] = toFirestoreValue(value[key]);
        }
        return {
            mapValue: {
                fields,
            },
        };
    }
    // Fallback for other types
    return { stringValue: JSON.stringify(value) };
};

// Helper to convert a Firestore typed value back to a JavaScript value
const fromFirestoreValue = (firestoreValue: any): any => {
    if (firestoreValue.nullValue !== undefined) {
        return null;
    }
    if (firestoreValue.stringValue !== undefined) {
        return firestoreValue.stringValue;
    }
    if (firestoreValue.booleanValue !== undefined) {
        return firestoreValue.booleanValue;
    }
    if (firestoreValue.integerValue !== undefined) {
        return parseInt(firestoreValue.integerValue, 10);
    }
    if (firestoreValue.doubleValue !== undefined) {
        return firestoreValue.doubleValue;
    }
    if (firestoreValue.arrayValue && firestoreValue.arrayValue.values) {
        return firestoreValue.arrayValue.values.map(fromFirestoreValue);
    }
    if (firestoreValue.mapValue && firestoreValue.mapValue.fields) {
        const obj: { [key: string]: any } = {};
        for (const key in firestoreValue.mapValue.fields) {
            obj[key] = fromFirestoreValue(firestoreValue.mapValue.fields[key]);
        }
        return obj;
    }
    return undefined;
};


// Converts a Firestore document from the API into a clean SavedPlan object
const fromFirestoreDocument = (doc: any): SavedPlan => {
    const fields = doc.fields || {};
    const jsObject: { [key: string]: any } = {};
    for (const key in fields) {
        jsObject[key] = fromFirestoreValue(fields[key]);
    }
    // Extract ID from the 'name' property (e.g., projects/.../documents/users/userId/plans/documentId)
    jsObject.id = doc.name.split('/').pop();
    return jsObject as SavedPlan;
};

// Converts a SavedPlan object into a Firestore document format for saving
const toFirestoreDocument = (plan: Omit<SavedPlan, 'id'>) => {
    const fields: { [key: string]: any } = {};
    for (const key in plan) {
        fields[key] = toFirestoreValue((plan as any)[key]);
    }
    return { fields };
};


export const getSavedPlans = async (userId: string): Promise<SavedPlan[]> => {
    try {
        const response = await fetch(`${BASE_URL}/users/${userId}/plans?key=${FIREBASE_API_KEY}&orderBy=createdAt desc`);
        if (!response.ok) {
            // If the user document doesn't exist, Firestore returns a 404, which is not an error but an empty list.
            if(response.status === 404) return [];
            throw new Error('Failed to fetch plans from Firestore.');
        }
        const data = await response.json();
        if (!data.documents) {
            return [];
        }
        const plans = data.documents.map(fromFirestoreDocument);
        return plans;
    } catch (error) {
        console.error("Error fetching saved plans:", error);
        throw new Error("ไม่สามารถดึงข้อมูลแผนที่บันทึกไว้ได้");
    }
};

export const savePlan = async (plan: SavedPlan, userId: string): Promise<void> => {
    try {
        const { id, ...planData } = plan;
        const firestoreDoc = toFirestoreDocument(planData);
        
        // The path now includes the user's UID to scope the data
        const response = await fetch(`${BASE_URL}/users/${userId}/plans?documentId=${id}&key=${FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(firestoreDoc),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Firestore save error:', errorData);
            throw new Error('Failed to save plan to Firestore.');
        }
    } catch (error) {
        console.error("Error saving plan:", error);
        throw new Error("ไม่สามารถบันทึกแผนได้ กรุณาลองใหม่");
    }
};