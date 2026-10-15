const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, trim: true, unique: true, maxlength: 30 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  department: { type: String, required: true, trim: true, maxlength: 100 },
  semester: { type: Number, required: true, min: 1, max: 12 },
  contact: { type: String, trim: true, default: '', maxlength: 20 }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
