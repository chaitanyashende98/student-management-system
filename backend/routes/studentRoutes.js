const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');

const router = express.Router();
const fields = ['studentId', 'name', 'email', 'department', 'semester', 'contact'];

function cleanPayload(body) {
  const result = {};
  for (const key of fields) if (body[key] !== undefined) result[key] = body[key];
  if (typeof result.semester === 'string' && result.semester.trim() !== '') result.semester = Number(result.semester);
  return result;
}
function validatePayload(payload, partial = false) {
  const required = ['studentId', 'name', 'email', 'department', 'semester'];
  if (!partial && required.some(key => payload[key] === undefined || payload[key] === '')) {
    return 'Please provide studentId, name, email, department, and semester';
  }
  if (payload.semester !== undefined && (!Number.isInteger(payload.semester) || payload.semester < 1 || payload.semester > 12)) {
    return 'Semester must be a whole number between 1 and 12';
  }
  return null;
}
function validId(id) { return mongoose.Types.ObjectId.isValid(id); }

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = q ? { $or: [
      { studentId: { $regex: escapeRegex(q), $options: 'i' } },
      { name: { $regex: escapeRegex(q), $options: 'i' } },
      { email: { $regex: escapeRegex(q), $options: 'i' } },
      { department: { $regex: escapeRegex(q), $options: 'i' } }
    ] } : {};
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (err) { next(err); }
});
router.get('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    const error = validatePayload(payload);
    if (error) return res.status(400).json({ success: false, message: error });
    const student = await Student.create(payload);
    res.status(201).json({ success: true, message: 'Student added successfully', data: student });
  } catch (err) { next(err); }
});
router.put('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const payload = cleanPayload(req.body);
    const error = validatePayload(payload, true);
    if (error) return res.status(400).json({ success: false, message: error });
    const student = await Student.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student updated successfully', data: student });
  } catch (err) { next(err); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid student ID' });
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) { next(err); }
});
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

module.exports = router;
