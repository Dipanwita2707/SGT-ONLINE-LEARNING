const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Logout (optional: implement token blacklisting)
exports.logout = async (req, res) => {
  try {
    // If you implement token blacklisting, add the token to the blacklist here
    // For a simple implementation, just return success since the frontend will handle clearing localStorage
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Request password reset (send email with link)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Normalize email (trim whitespace and convert to lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Received password reset request for email:', normalizedEmail);
    
    // Do a case-insensitive search to maximize chances of finding the user
    const user = await User.findOne({ email: normalizedEmail });
    
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      // Try a more flexible search if exact match not found
      const similarEmailUser = await User.findOne({ 
        email: { $regex: new RegExp(normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } 
      });
      
      if (similarEmailUser) {
        console.log('Found user with similar email:', similarEmailUser.email);
        return res.status(404).json({ 
          message: 'User not found. Did you mean ' + similarEmailUser.email + '?',
          suggestedEmail: similarEmailUser.email
        });
      }
      
      return res.status(404).json({ message: 'User not found with this email address. Please check for typos or contact support.' });
    }
    
    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    console.log('Generated reset token for user:', user.email);
    
    // Create transporter (adjust settings as needed)
    const transporter = nodemailer.createTransporter({
      // Gmail example:
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
    
    res.json({ message: 'Password reset email sent successfully' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    console.log('Password reset successful for user:', user.email);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Change password (requires current password)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    console.log('Password changed for user:', user.email);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Login (all roles) - Enhanced with UID support
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body; // Note: 'email' field now accepts email or UID
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email/UID and password are required' });
    }
    
    const userInput = email.trim();
    let user;
    
    // Check if input is an email (contains @) or a UID
    if (userInput.includes('@')) {
      // Input is an email
      const normalizedEmail = userInput.toLowerCase();
      user = await User.findOne({ email: normalizedEmail })
        .populate({
          path: 'roleAssignments.school roleAssignments.schools',
          select: 'name code'
        })
        .populate({
          path: 'roleAssignments.departments',
          select: 'name code school'
        });
      
      if (!user) {
        // Try a more flexible email search if exact match not found
        const similarEmailUser = await User.findOne({ 
          email: { $regex: new RegExp(normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } 
        });
        
        if (similarEmailUser) {
          console.log('Found user with similar email during login:', similarEmailUser.email);
          // Don't suggest the email for security reasons, just use a generic message
          return res.status(400).json({ message: 'Invalid credentials. Please check your email address.' });
        }
      }
    } else {
      // Input is a UID - search by regNo, teacherId, or studentId
      user = await User.findOne({
        $or: [
          { regNo: userInput },
          { teacherId: userInput },
          { studentId: userInput }
        ]
      })
      .populate({
        path: 'roleAssignments.school roleAssignments.schools',
        select: 'name code'
      })
      .populate({
        path: 'roleAssignments.departments',
        select: 'name code school'
      });
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });
    
    // Ensure permissions exist in both formats (lowercase with underscores and title case with spaces)
    const normalizedPermissions = [];
    
    if (user.permissions && Array.isArray(user.permissions)) {
      // First add all original permissions
      normalizedPermissions.push(...user.permissions);
      
      // Then add normalized versions in both formats
      user.permissions.forEach(perm => {
        // Convert snake_case to Title Case
        if (perm.includes('_')) {
          const titleCasePerm = perm.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          if (!normalizedPermissions.includes(titleCasePerm)) {
            normalizedPermissions.push(titleCasePerm);
          }
        } 
        // Convert Title Case to snake_case
        else if (/[A-Z]/.test(perm)) {
          const snakeCasePerm = perm.toLowerCase().replace(/\s+/g, '_');
          
          if (!normalizedPermissions.includes(snakeCasePerm)) {
            normalizedPermissions.push(snakeCasePerm);
          }
        }
      });
    }
    
    console.log('Normalized permissions:', normalizedPermissions);
    
    const token = jwt.sign({ 
      _id: user._id,
      id: user._id, 
      name: user.name,
      email: user.email,
      regNo: user.regNo,
      teacherId: user.teacherId,
      role: user.primaryRole || user.role, // Use primaryRole as the main role
      roles: user.roles || [user.role], // Include all roles array
      primaryRole: user.primaryRole || user.role,
      school: user.school,
      department: user.department,
      departments: user.departments || [],
      // Role-specific assignments for enhanced multi-role system
      roleAssignments: user.roleAssignments || [],
      permissions: normalizedPermissions
    }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        regNo: user.regNo,
        teacherId: user.teacherId, 
        role: user.role,
        roles: user.roles || [user.role],
        primaryRole: user.primaryRole || user.role,
        school: user.school,
        department: user.department,
        permissions: normalizedPermissions
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Get current authenticated user with multi-role support
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get full user data with populated references
    const user = await User.findById(req.user._id)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Support both multi-role and legacy single-role systems
    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      regNo: user.regNo,
      teacherId: user.teacherId,
      role: user.role,
      roles: user.roles || [user.role],
      primaryRole: user.primaryRole || user.role,
      permissions: user.permissions || [],
      school: user.school,
      department: user.department,
      isActive: user.isActive
    };
    
    res.json(responseData);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: err.message });
  }
};