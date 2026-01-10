const PDFDocument = require("pdfkit");

function generateResumePDF(res, data) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
  doc.pipe(res);

  const contentIndent = 10;

  // === Helper: Format date ===
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  // === Helper: Title + Small Date ===
  const printTitleWithDate = (title, date) => {
    doc.fontSize(14).font("Times-Roman").text(title, { indent: contentIndent });
    doc.fontSize(10).fillColor("#555").text(date, { indent: contentIndent });
    doc.fillColor("black");
  };

  // === Helper: Bullet point ===
  const bullet = (text) => {
    doc.fontSize(12).text(`• ${text}`, {
      indent: contentIndent + 5,
      align: "justify",
    });
  };

  // === Helper: Section Title ===
  const section = (title) => {
    doc.moveDown(0.6);
    doc.fontSize(16).font("Times-Bold").text(title);

    const yPos = doc.y + 2;
    doc
      .moveTo(50, yPos)
      .lineTo(doc.page.width - 50, yPos)
      .strokeColor("#777")
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.4);
  };

  // ✅ HEADER
  doc
    .fontSize(26)
    .font("Times-Bold")
    .text(data.name || "No Name", { align: "center" });
  doc
    .fontSize(12)
    .font("Times-Roman")
    .text(
      `${data.email || "N/A"} | ${data.phone || "N/A"} | ${
        data.location || "N/A"
      }`,
      { align: "center" }
    );

  let links = [];
  if (data.linkedinUrl) links.push(`LinkedIn: ${data.linkedinUrl}`);
  if (data.githubUrl) links.push(`GitHub: ${data.githubUrl}`);

  if (links.length > 0) {
    doc.moveDown(0.3);
    doc
      .fillColor("blue")
      .fontSize(11)
      .text(links.join(" | "), { align: "center" });
    doc.fillColor("black");
  }

  doc.moveDown(1);

  // ✅ SUMMARY
  section("Professional Summary");
  doc
    .fontSize(12)
    .font("Times-Roman")
    .text(data.summary || "No summary provided", {
      align: "justify",
      indent: contentIndent,
    });
  // ✅ SKILLS
  section("Skills");
  doc.font("Times-Roman");
  (data.skills || []).forEach((s) => bullet(s));

  // ✅ EXPERIENCE
  section("Experience");
  (data.experience || []).forEach((job) => {
    const startDate = formatDate(job.start_date);
    const endDate = job.currently_working
      ? "Present"
      : formatDate(job.end_date);

    printTitleWithDate(
      `${job.title || "No Title"}, ${job.company || "Unknown Company"}`,
      `${startDate} – ${endDate}`
    );

    bullet(
      `${job.employment_type || "Employment Type"} | ${
        job.location || "Location"
      }`
    );

    if (job.description) {
      doc.fontSize(12).text(job.description, {
        align: "justify",
        indent: contentIndent + 10,
      });
    }

    doc.moveDown(0.5);
  });

  // ✅ EDUCATION
  section("Education");
  (data.education || []).forEach((edu) => {
    printTitleWithDate(
      `${edu.degree || "Degree"} in ${edu.field_of_study || "Field"}`,
      `${edu.start_year || "N/A"} – ${
        edu.end_year || (edu.currently_studying ? "Present" : "N/A")
      }`
    );

    bullet(`${edu.institution || "Institution"}`);
    if (edu.grade) bullet(`Grade: ${edu.grade}`);

    doc.moveDown(0.4);
  });

  // ✅ PROJECTS
  section("Projects");
  (data.projects || []).forEach((p) => {
    const startDate = formatDate(p.start_date);
    const endDate = p.currently_working ? "Present" : formatDate(p.end_date);

    printTitleWithDate(p.title || "Untitled Project", `${startDate} completed`);

    if (p.description)
      doc.fontSize(12).text(p.description, {
        align: "justify",
        indent: contentIndent + 10,
      });

    if (p.technologies) bullet(`Tech: ${p.technologies}`);
    if (p.project_link) bullet(`Link: ${p.project_link}`);

    doc.moveDown(0.5);
  });

  // ✅ COURSES
  section("Courses");
  (data.courses || []).forEach((course) => {
    const date = formatDate(course.completion_date);

    printTitleWithDate(course.course_name || "No Course Name", `${date}`);

    bullet(`Provider: ${course.provider || "N/A"}`);
    doc.moveDown(0.4);
  });

  // ✅ ACHIEVEMENTS
  section("Achievements");
  (data.achievements || []).forEach((a) => {
    const date = formatDate(a.date);

    printTitleWithDate(a.title || "No Title", date || "");

    if (a.tag) bullet(`Tag: ${a.tag}`);
    if (a.description)
      doc.fontSize(12).text(a.description, {
        align: "justify",
        indent: contentIndent + 10,
      });

    doc.moveDown(0.4);
  });

  doc.end();
}

module.exports = generateResumePDF;

// const PDFDocument = require("pdfkit");

// function generateResumePDF(res, data) {
//   const doc = new PDFDocument({ margin: 50, size: "A4" });

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
//   doc.pipe(res);

//   const contentIndent = 10;

//   // Format dates like "Jan 2024"
//   const formatDate = (date) => {
//     if (!date) return "N/A";
//     return new Date(date).toLocaleDateString("en-US", {
//       month: "short",
//       year: "numeric",
//     });
//   };

//   // ========== HEADER ==========
//   doc
//     .fontSize(26)
//     .font("Times-Bold")
//     .text(data.name || "No Name", { align: "center" });

//   doc
//     .fontSize(12)
//     .font("Times-Roman")
//     .text(
//       `${data.email || "N/A"} | ${data.phone || "N/A"} | ${
//         data.location || "N/A"
//       }`,
//       { align: "center" }
//     );

//   let links = [];
//   if (data.linkedinUrl) links.push(`LinkedIn: ${data.linkedinUrl}`);
//   if (data.githubUrl) links.push(`GitHub: ${data.githubUrl}`);

//   if (links.length > 0) {
//     doc.moveDown(0.3);
//     doc.fillColor("blue").fontSize(11).text(links.join(" | "), {
//       align: "center",
//     });
//     doc.fillColor("black");
//   }

//   doc.moveDown(1);

//   // ===== SECTION TITLE WITH LINE =====
//   const section = (title) => {
//     doc.moveDown(0.6);
//     doc.fontSize(16).font("Times-Bold").text(title);

//     const yPos = doc.y + 2;
//     doc
//       .moveTo(50, yPos)
//       .lineTo(doc.page.width - 50, yPos)
//       .strokeColor("#777")
//       .lineWidth(1)
//       .stroke();

//     doc.moveDown(0.4);
//     doc.font("Times-Roman");
//   };

//   const bullet = (text) => {
//     doc.fontSize(12).text(`• ${text}`, {
//       indent: contentIndent,
//       align: "justify",
//     });
//   };

//   // ===== SUMMARY =====
//   section("Professional Summary");
//   doc.fontSize(12).text(data.summary || "No summary provided", {
//     align: "justify",
//     indent: contentIndent,
//   });

//   // ===== SKILLS =====
//   section("Skills");
//   (data.skills || []).forEach((s) => bullet(s));

//   // ===== EXPERIENCE =====
//   section("Experience");
//   (data.experience || []).forEach((job) => {
//     const startDate = formatDate(job.start_date);
//     const endDate = job.currently_working
//       ? "Present"
//       : formatDate(job.end_date);

//     const roleLine = `${job.title || "No Title"}, ${
//       job.company || "Unknown Company"
//     } | ${startDate} – ${endDate}`;

//     doc.fontSize(14).font("Times-Roman").text(roleLine, {
//       indent: contentIndent,
//     });

//     bullet(
//       `${job.employment_type || "Employment Type"} | ${
//         job.location || "Location not specified"
//       }`
//     );

//     if (job.description) {
//       doc.fontSize(12).text(job.description, {
//         align: "justify",
//         indent: contentIndent + 10,
//       });
//     }

//     doc.moveDown(0.5);
//     doc.font("Times-Roman");
//   });

//   // ===== EDUCATION =====
//   section("Education");
//   (data.education || []).forEach((edu) => {
//     const degreeLine = `${edu.degree || "Degree"} in ${
//       edu.field_of_study || "Field"
//     }`;
//     const eduDates = `${edu.start_year || "N/A"} – ${
//       edu.end_year || (edu.currently_studying ? "Present" : "N/A")
//     }`;

//     doc.fontSize(14).font("Times-Roman").text(degreeLine, {
//       indent: contentIndent,
//     });

//     bullet(`${edu.institution || "Institution"} (${eduDates})`);

//     if (edu.grade) bullet(`Grade: ${edu.grade}`);

//     doc.moveDown(0.4);
//   });

//   // ===== PROJECTS =====
//   section("Projects");
//   (data.projects || []).forEach((p) => {
//     const startDate = formatDate(p.start_date);
//     const endDate = p.currently_working ? "Present" : formatDate(p.end_date);

//     doc
//       .fontSize(14)
//       .font("Times-Roman")
//       .text(`${p.title || "Untitled Project"} | ${startDate}`, {
//         indent: contentIndent,
//       });

//     if (p.description)
//       doc.fontSize(12).text(p.description, {
//         align: "justify",
//         indent: contentIndent + 10,
//       });

//     if (p.technologies) bullet(`Tech: ${p.technologies}`);

//     if (p.project_link) {
//       bullet(`Link: ${p.project_link}`);
//     }

//     doc.moveDown(0.5);
//   });

//   // ===== COURSES =====
//   section("Courses");
//   (data.courses || []).forEach((course) => {
//     const date = formatDate(course.completion_date);

//     doc
//       .fontSize(14)
//       .font("Times-Roman")
//       .text(course.course_name || "No Course Name", {
//         indent: contentIndent,
//       });

//     bullet(`Provider: ${course.provider || "N/A"} | Completed: ${date}`);

//     doc.moveDown(0.4);
//   });

//   // ===== ACHIEVEMENTS =====
//   section("Achievements");
//   (data.achievements || []).forEach((a) => {
//     const date = formatDate(a.date);

//     doc
//       .fontSize(14)
//       .font("Times-Roman")
//       .text(`${a.title || "No Title"} | ${a.date ? `${date}` : ""}`, {
//         indent: contentIndent,
//       });

//     if (a.tag) bullet(`Tag: ${a.tag}`);
//     if (a.description)
//       doc.fontSize(12).text(a.description, {
//         align: "justify",
//         indent: contentIndent + 10,
//       });

//     doc.moveDown(0.4);
//   });

//   doc.end();
// }

// module.exports = generateResumePDF;
