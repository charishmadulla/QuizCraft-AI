import { jsPDF } from "jspdf";

export const generateQuizReportPDF = ({
  quizTitle = "Practice Quiz",
  difficulty = "Medium",
  score = 0,
  totalQuestions = 0,
  percentage = 0,
  timeTaken = 0,
  submittedAt = new Date(),
  results = [],
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (spaceNeeded) => {
    if (y + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderSmall();
    }
  };

  const drawHeaderSmall = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(119, 117, 138);
    doc.text("QuizCraft AI · Learning & Assessment Report", margin, 10);
    doc.setDrawColor(236, 234, 242);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // 1. Header Banner
  doc.setFillColor(244, 241, 250); // Soft lavender background
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(52, 50, 71);
  doc.text("QuizCraft AI", margin + 6, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(119, 117, 138);
  doc.text("Smart Quiz Generator & Learning Assessment Report", margin + 6, y + 17);

  const dateStr = new Date(submittedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 6, y + 17, { align: "right" });

  y += 32;

  // 2. Quiz Metadata & Score Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(52, 50, 71);
  doc.text(quizTitle, margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(119, 117, 138);
  const diffStr = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  const timeStr = timeTaken > 0 ? `${minutes}m ${seconds}s` : "Untimed";
  doc.text(`Difficulty: ${diffStr}  |  Total Questions: ${totalQuestions}  |  Time: ${timeStr}`, margin, y);
  y += 8;

  // Score Highlight Box
  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.filter((r) => !r.isCorrect && r.selectedAnswer !== null).length;
  const unansweredCount = results.filter((r) => r.selectedAnswer === null).length;

  doc.setFillColor(248, 247, 252);
  doc.setDrawColor(220, 208, 242);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

  // Score column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(126, 105, 171); // Lavender purple
  doc.text(`${score} / ${totalQuestions} (${percentage}%)`, margin + 10, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(119, 117, 138);
  doc.text("FINAL SCORE", margin + 10, y + 16);

  // Breakdown metrics
  const colX = margin + 80;
  doc.setFontSize(9);
  doc.setTextColor(45, 106, 79);
  doc.text(`✓ Correct: ${correctCount}`, colX, y + 10);
  doc.setTextColor(180, 62, 94);
  doc.text(`✗ Incorrect: ${incorrectCount}`, colX + 35, y + 10);
  doc.setTextColor(119, 117, 138);
  doc.text(`- Unanswered: ${unansweredCount}`, colX + 70, y + 10);

  y += 30;

  // 3. Question-by-Question Review
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(52, 50, 71);
  doc.text("DETAILED QUESTION REVIEW", margin, y);
  y += 4;
  doc.setDrawColor(236, 234, 242);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  results.forEach((item, index) => {
    checkPageBreak(40);

    const isCorrect = item.isCorrect;
    const isUnanswered = item.selectedAnswer === null || item.selectedAnswer === undefined;

    // Status pill
    let statusText = "CORRECT";
    let statusBg = [227, 241, 233]; // Mint
    let statusColor = [45, 106, 79];

    if (isUnanswered) {
      statusText = "UNANSWERED";
      statusBg = [244, 241, 250];
      statusColor = [119, 117, 138];
    } else if (!isCorrect) {
      statusText = "INCORRECT";
      statusBg = [248, 229, 237]; // Pink
      statusColor = [180, 62, 94];
    }

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(margin, y - 3, 24, 6, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusText, margin + 12, y + 1.2, { align: "center" });

    // Question Number & Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(52, 50, 71);
    const qNumber = `Q${index + 1}. `;
    const qLines = doc.splitTextToSize(qNumber + item.question, contentWidth - 30);
    doc.text(qLines, margin + 28, y + 1);
    y += qLines.length * 4.5 + 4;

    // Options list
    item.options.forEach((opt, optIdx) => {
      checkPageBreak(8);
      const letter = String.fromCharCode(65 + optIdx);
      const isSelected = item.selectedAnswer === optIdx;
      const isRight = item.correctAnswer === optIdx;

      let optPrefix = `[ ] ${letter}. `;
      let optColor = [119, 117, 138];

      if (isRight) {
        optPrefix = `[✓] ${letter}. `;
        optColor = [45, 106, 79];
      } else if (isSelected && !isRight) {
        optPrefix = `[✗] ${letter}. `;
        optColor = [180, 62, 94];
      }

      doc.setFont("helvetica", isSelected || isRight ? "bold" : "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(optColor[0], optColor[1], optColor[2]);

      let suffix = "";
      if (isSelected && isRight) suffix = " (Your Answer - Correct)";
      else if (isSelected) suffix = " (Your Answer)";
      else if (isRight) suffix = " (Correct Answer)";

      const optLines = doc.splitTextToSize(`${optPrefix}${opt}${suffix}`, contentWidth - 10);
      doc.text(optLines, margin + 6, y);
      y += optLines.length * 4;
    });

    // Explanation Box
    if (item.explanation) {
      checkPageBreak(16);
      y += 2;
      doc.setFillColor(248, 247, 252);
      const expLines = doc.splitTextToSize(`Explanation: ${item.explanation}`, contentWidth - 16);
      const boxHeight = expLines.length * 4 + 4;

      doc.roundedRect(margin + 4, y - 2, contentWidth - 8, boxHeight, 1, 1, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(119, 117, 138);
      doc.text(expLines, margin + 8, y + 2);
      y += boxHeight + 4;
    }

    y += 4;
    doc.setDrawColor(240, 238, 245);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  });

  // Footer on last page
  checkPageBreak(12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(158, 156, 170);
  doc.text("QuizCraft AI — Learn smarter, one question at a time.", pageWidth / 2, pageHeight - 8, {
    align: "center",
  });

  // Save the PDF
  const safeFilename = quizTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`QuizCraft_${safeFilename}_Report.pdf`);
};
