/**
 * Wraps an async function to catch any errors and pass them to Express's error handling middleware
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default catchAsync; 