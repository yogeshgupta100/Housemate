import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import PropTypes from "prop-types";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger"
}) => {
  const colors = {
    danger: {
      button: "bg-red-500 hover:bg-red-600",
      icon: "text-red-500",
      iconBg: "bg-red-50"
    },
    warning: {
      button: "bg-yellow-500 hover:bg-yellow-600",
      icon: "text-yellow-500",
      iconBg: "bg-yellow-50"
    },
    info: {
      button: "bg-blue-500 hover:bg-blue-600",
      icon: "text-blue-500",
      iconBg: "bg-blue-50"
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-4">
                <AlertTriangle className={`w-6 h-6 ${colors[type].icon}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {title}
              </h3>
              <p className="text-gray-600 text-center">{message}</p>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 transition-colors ${colors[type].button}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(["danger", "warning", "info"])
};

export default ConfirmDialog;
