"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ReceivedMails() {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMails() {
      try {
        const res = await axios.get("/api/gmail");
        setMails(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMails();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg">Loading mails...</p>
      </div>
    );

  if (mails.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg">No mails found.</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      <ul className="space-y-4">
        {mails.map((mail) => {
          const from =
            mail.payload.headers.find((h) => h.name === "From")?.value ||
            "Unknown Sender";
          const subject =
            mail.payload.headers.find((h) => h.name === "Subject")?.value ||
            "(No Subject)";
          const date =
            mail.payload.headers.find((h) => h.name === "Date")?.value ||
            "";

          return (
            <li
              key={mail.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{date}</p>
                <span className="text-blue-500 font-medium">{from}</span>
              </div>
              <p className="mt-2 font-semibold text-gray-800">{subject}</p>
              <p className="mt-1 text-gray-600 line-clamp-2">
                {mail.snippet || ""}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
