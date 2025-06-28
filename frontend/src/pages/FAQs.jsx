import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border-b border-gray-200 last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-4 -mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 pr-4">{question}</h3>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-6 px-4 -mx-4">
              <p className="text-gray-600 leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState(new Set([0])); // First item open by default

  const faqs = [
    {
      question: "How do I find properties on Housemate?",
      answer: "You can browse properties by visiting our Properties page, using the search filters to narrow down by location, price range, property type, and other criteria. You can also use our AI Property Hub for personalized recommendations."
    },
    {
      question: "How do I contact a property owner or agent?",
      answer: "Once you find a property you're interested in, you can contact the owner or agent through the contact information provided on the property listing page. You can also use our contact form or call our support team."
    },
    {
      question: "Is it free to browse properties on Housemate?",
      answer: "Yes, browsing properties on Housemate is completely free. You can view property listings, photos, and details without any cost. Some premium features may require registration."
    },
    {
      question: "How do I list my property on Housemate?",
      answer: "To list your property, click on 'List Property' in the navigation menu. You'll need to create an account, fill out the property details form, upload photos, and submit for review. Our team will verify the information before publishing."
    },
    {
      question: "What information do I need to provide when listing a property?",
      answer: "You'll need to provide property details including address, price, number of bedrooms/bathrooms, property type, amenities, high-quality photos, contact information, and availability dates."
    },
    {
      question: "How long does it take for my property listing to be published?",
      answer: "Property listings are typically reviewed and published within 24-48 hours. We verify all information to ensure quality and accuracy for our users."
    },
    {
      question: "Can I edit or remove my property listing?",
      answer: "Yes, you can edit your property listing at any time through your account dashboard. You can also remove or deactivate listings when they're no longer available."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including credit/debit cards, net banking, UPI, and digital wallets. Payment options may vary based on the service you're using."
    },
    {
      question: "How do I report a fraudulent listing?",
      answer: "If you encounter a suspicious or fraudulent listing, please contact our support team immediately with the listing details. We take such reports seriously and will investigate promptly."
    },
    {
      question: "Do you offer virtual tours or 3D viewings?",
      answer: "Yes, we offer virtual tours and 3D viewings for select properties. Look for the virtual tour icon on property listings to experience immersive property viewing."
    },
    {
      question: "How can I save properties I'm interested in?",
      answer: "You can save properties by creating an account and using the 'Save' or 'Favorite' feature on property listings. This allows you to easily access your saved properties later."
    },
    {
      question: "What should I do if I have technical issues with the website?",
      answer: "If you experience technical issues, please try refreshing the page first. If the problem persists, contact our technical support team with details about the issue and your device/browser information."
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions - Housemate</title>
        <meta name="description" content="Find answers to common questions about Housemate - your trusted partner in finding the perfect home. Browse FAQs about property listings, payments, and more." />
        <meta name="keywords" content="FAQs, frequently asked questions, Housemate, property rental, real estate, housing" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white pt-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Find answers to common questions about Housemate and our services
              </p>
            </motion.div>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {searchTerm && (
              <p className="mt-3 text-sm text-gray-600">
                Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        </div>

        {/* FAQs Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-8">
              {filteredFAQs.length > 0 ? (
                <div className="space-y-2">
                  {filteredFAQs.map((faq, index) => (
                    <FAQItem
                      key={index}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openItems.has(index)}
                      onToggle={() => toggleItem(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No FAQs found matching your search.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact Support Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you with any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Contact Support
              </a>
              <a
                href="mailto:Be.housemate@gmail.com"
                className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                Email Us
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default FAQs; 