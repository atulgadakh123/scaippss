import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase"; // your existing firebase config

const USER_ID = "hhthdh55j5j5j5j5jsd";

/* ---------------- TEMPLATES ---------------- */
export const getTemplates = async () => {
  const q = query(
    collection(db, "templates"),
    where("userId", "==", USER_ID)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const saveTemplate = async (template) => {
  const { id, ...data } = template;

  if (id) {
    await updateDoc(doc(db, "templates", id), {
      ...data,
      userId: USER_ID,
    });
    return template;
  }

  const docRef = await addDoc(collection(db, "templates"), {
    ...data,
    userId: USER_ID,
    createdAt: serverTimestamp(),
  });

  return { ...data, id: docRef.id };
};


export const deleteTemplate = async (id) =>
  deleteDoc(doc(db, "templates", id));

/* ---------------- CONTACTS ---------------- */
export const getContacts = async () => {
  const q = query(
    collection(db, "contacts"),
    where("userId", "==", USER_ID)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const saveContact = async (contact) => {
  const { id, ...data } = contact;

  if (id) {
    await updateDoc(doc(db, "contacts", id), {
      ...data,
      userId: USER_ID,
    });
    return contact;
  }

  const docRef = await addDoc(collection(db, "contacts"), {
    ...data,
    userId: USER_ID,
    createdAt: serverTimestamp(),
  });

  return { ...data, id: docRef.id };
};


export const deleteContact = async (id) =>
  deleteDoc(doc(db, "contacts", id));

/* ---------------- GROUPS ---------------- */
export const getGroups = async () => {
  const q = query(
    collection(db, "groups"),
    where("userId", "==", USER_ID)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const saveGroup = async (group) => {
  const { id, ...data } = group; // ⬅️ REMOVE id safely

  if (id) {
    // UPDATE
    await updateDoc(doc(db, "groups", id), {
      ...data,
      userId: USER_ID,
    });
    return group;
  }
  

  // CREATE
  const docRef = await addDoc(collection(db, "groups"), {
    ...data,
    userId: USER_ID,
    createdAt: serverTimestamp(),
  });

  return { ...data, id: docRef.id };
};


export const deleteGroup = async (id) =>
  deleteDoc(doc(db, "groups", id));