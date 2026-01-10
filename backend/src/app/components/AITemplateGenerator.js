"use client";
import { useState } from "react";

export default function AITemplateEditor({ formData, setFormData }) {
  const [prompt, setPrompt] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ===== Generate Templates ===== */
  const generateTemplates = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      setTemplates(data);
      setSelectedIndex(null);
    } catch (err) {
      console.error(err);
      alert("Failed to generate templates");
    } finally {
      setLoading(false);
    }
  };

  /* ===== Select Template → Fill Custom Fields ===== */
  const handleSelectTemplate = (tpl, index) => {
    setSelectedIndex(index);
    setFormData((prev) => ({
      ...prev,
      name: tpl.name,
      subject: tpl.subject,
      intro: tpl.intro || "",
      mainBody: tpl.mainBody || "",
      footer: tpl.footer || "",
    }));
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-4 mt-4">
      <h4 className="font-semibold text-gray-800">AI Template Generator</h4>

      {/* Prompt Input */}
      <textarea
        rows={6}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your prompt here..."
        className="w-full border rounded-lg p-3 text-black"
      />

      <button
        onClick={generateTemplates}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Templates"}
      </button>

      {/* Generated Templates */}
      {templates.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-semibold">Select a Template</h5>
          {templates.map((tpl, index) => (
            <label
              key={index}
              className={`block border rounded-lg p-3 cursor-pointer ${
                selectedIndex === index
                  ? "border-blue-600 bg-blue-50"
                  : "hover:bg-white"
              }`}
            >
              <input
                type="radio"
                className="mr-2"
                checked={selectedIndex === index}
                onChange={() => handleSelectTemplate(tpl, index)}
              />
              <div className="font-medium text-gray-900">{tpl.name}</div>
              <div className="text-sm text-gray-600">
                <strong>Subject:</strong> {tpl.subject}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Live Preview */}
      {(formData.intro || formData.mainBody || formData.footer) && (
        <div className="border rounded-lg bg-white p-4">
          <h5 className="font-semibold mb-2">Live Preview</h5>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Subject:</strong> {formData.subject}
          </p>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">
            {formData.intro}
            {"\n\n"}
            {formData.mainBody}
            {"\n\n"}
            {formData.footer}
          </pre>
        </div>
      )}
    </div>
  );
}
