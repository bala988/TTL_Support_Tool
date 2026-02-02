
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';

console.log("Imports successful");
console.log("ExcelJS:", ExcelJS ? "OK" : "Missing");
console.log("PDFDocument:", PDFDocument ? "OK" : "Missing");
console.log("Archiver:", archiver ? "OK" : "Missing");
