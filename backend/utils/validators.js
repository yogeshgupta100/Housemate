/**
 * Validates if a string is a valid email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email, false otherwise
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates if a string is a valid phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid phone number, false otherwise
 */
export const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
};

/**
 * Validates if a string is a valid password
 * @param {string} password - The password to validate
 * @returns {boolean} True if valid password, false otherwise
 */
export const isValidPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

/**
 * Validates if a string is a valid UUID
 * @param {string} uuid - The UUID to validate
 * @returns {boolean} True if valid UUID, false otherwise
 */
export const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Validates if a string is a valid date
 * @param {string} date - The date to validate
 * @returns {boolean} True if valid date, false otherwise
 */
export const isValidDate = (date) => {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Validates if a number is within a specified range
 * @param {number} value - The number to validate
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {boolean} True if within range, false otherwise
 */
export const isInRange = (value, min, max) => {
    return value >= min && value <= max;
};

/**
 * Validates if a string is not empty and has a minimum length
 * @param {string} str - The string to validate
 * @param {number} minLength - The minimum length required
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidString = (str, minLength = 1) => {
    return typeof str === 'string' && str.trim().length >= minLength;
};

/**
 * Validates if an object has all required fields
 * @param {Object} obj - The object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {boolean} True if all required fields are present, false otherwise
 */
export const hasRequiredFields = (obj, requiredFields) => {
    return requiredFields.every(field => obj.hasOwnProperty(field) && obj[field] !== undefined && obj[field] !== null);
};

/**
 * Validates if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
export const isValidURL = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Validates if a string is a valid price
 * @param {string|number} price - The price to validate
 * @returns {boolean} True if valid price, false otherwise
 */
export const isValidPrice = (price) => {
    const numPrice = Number(price);
    return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Validates if a string is a valid postal code
 * @param {string} postalCode - The postal code to validate
 * @returns {boolean} True if valid postal code, false otherwise
 */
export const isValidPostalCode = (postalCode) => {
    // Basic postal code validation (can be customized based on country)
    const postalCodeRegex = /^[A-Z0-9]{3,10}$/i;
    return postalCodeRegex.test(postalCode);
};

export const validateAdmin = (user) => {
    if (!user) {
        return false;
    }
    
    // Check if user has admin role
    return user.role === 'admin';
};

export const validateUser = (user) => {
    if (!user) {
        return false;
    }
    
    // Check if user has required fields
    const requiredFields = ['id', 'email', 'firstName', 'lastName'];
    if (!hasRequiredFields(user, requiredFields)) {
        return false;
    }
    
    // Validate email format
    if (!isValidEmail(user.email)) {
        return false;
    }
    
    // Validate name fields
    if (!isValidString(user.firstName) || !isValidString(user.lastName)) {
        return false;
    }
    
    return true;
}; 