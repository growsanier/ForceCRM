import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (
  title: string, 
  headers: string[], 
  data: (string | number)[][],
  filename: string
) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);

  // AutoTable
  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [1, 118, 211] },
    margin: { top: 30 }
  });

  doc.save(filename);
};
