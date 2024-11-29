import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

interface StockData {
    name: string;
    quantity: number;
    price: number;
    date: string;
}

export async function addStock(name: string, quantity: number, price: number) {
    const date = new Date().toISOString();
    try {
        const docRef = await addDoc(collection(db, "stock"), {
            name: name,
            quantity: quantity,
            price: price,
            date: date
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

export async function getStock(id: string) {
    const docRef = doc(db, "stock", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        return docSnap.data();
    } else {
        console.log("No such document!");
        return null;
    }
}

export async function updateStock(id: string, data: Partial<StockData>) {
    const docRef = doc(db, "stock", id);
    await updateDoc(docRef, data);
}

export async function deleteStock(id: string) {
    await deleteDoc(doc(db, "stock", id));
}