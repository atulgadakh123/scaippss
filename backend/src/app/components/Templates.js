import { Edit2, FileText, Plus, Send, Trash2 } from "lucide-react";
import React from "react";

function Templates({
  openModal,
  templates,
  setSendEmailModal,
  setSelectedTemplate,
  setSelectedContacts,
  handleDelete,
}) {
  const openSendEmailModal = (template) => {
    setSelectedTemplate(template);
    setSelectedContacts([]);
    setSendEmailModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Email Templates</h2>
        <button
          onClick={() => openModal("template")}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          // Combine intro + mainBody + footer for preview
          const previewText = `${template.intro || ""}\n\n${template.mainBody || ""}\n\n${template.footer || ""}`;

          return (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openModal("template", template)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete("template", template.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                <strong>Subject:</strong> {template.subject}
              </p>
              <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                {previewText}
              </p>

              <button
                onClick={() => openSendEmailModal(template)}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Bulk Email
              </button>
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No templates yet. Create your first template!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Templates;
