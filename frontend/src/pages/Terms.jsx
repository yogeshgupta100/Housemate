import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, AlertCircle } from 'lucide-react';

const Terms = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: `By accessing and using Housemate ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      title: "2. Description of Service",
      content: `Housemate is a real estate platform that connects property owners, agents, and potential tenants/buyers. We provide property listings, search functionality, contact information, and related services to facilitate property transactions.`
    },
    {
      title: "3. User Accounts and Registration",
      content: `To access certain features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials and for all activities that occur under your account.`
    },
    {
      title: "4. User Responsibilities",
      content: `Users are responsible for the accuracy and truthfulness of all information they provide, including property listings. Users must not post false, misleading, or fraudulent information. Users must respect the rights of others and not engage in harassment, discrimination, or illegal activities.`
    },
    {
      title: "5. Property Listings",
      content: `Property owners and agents are responsible for the accuracy of their listings, including pricing, availability, and property details. Housemate reserves the right to review, edit, or remove listings that violate our policies or contain inaccurate information.`
    },
    {
      title: "6. Privacy and Data Protection",
      content: `Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Platform, to understand our practices regarding the collection and use of your personal information.`
    },
    {
      title: "7. Intellectual Property Rights",
      content: `The Platform and its original content, features, and functionality are owned by Housemate and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.`
    },
    {
      title: "8. Prohibited Uses",
      content: `You may not use the Platform for any unlawful purpose or to solicit others to perform unlawful acts. You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.`
    },
    {
      title: "9. Termination",
      content: `We may terminate or suspend your account and bar access to the Platform immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.`
    },
    {
      title: "10. Limitation of Liability",
      content: `In no event shall Housemate, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.`
    },
    {
      title: "11. Disclaimers",
      content: `The information on the Platform is provided on an "as is" basis. Housemate makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.`
    },
    {
      title: "12. Governing Law",
      content: `These Terms shall be interpreted and governed by the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.`
    },
    {
      title: "13. Changes to Terms",
      content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.`
    },
    {
      title: "14. Contact Information",
      content: `If you have any questions about these Terms, please contact us at Be.housemate@gmail.com or through our contact form on the Platform.`
    }
  ];

  return (
    <>
      <Helmet>
        <title>Terms & Conditions - Housemate</title>
        <meta name="description" content="Read Housemate's Terms & Conditions. Understand the rules, rights, and responsibilities when using our property platform." />
        <meta name="keywords" content="terms and conditions, Housemate, legal, property platform, user agreement" />
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
                Terms & Conditions
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Please read these terms carefully before using Housemate
              </p>
              <p className="text-sm text-blue-200 mt-4">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Important Notice
                </h3>
                <p className="text-yellow-700">
                  By using Housemate, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our platform.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Terms Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-8">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`mb-8 ${index !== sections.length - 1 ? 'border-b border-gray-200 pb-8' : ''}`}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Key Points Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Key Points to Remember
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Accurate Information</h4>
                  <p className="text-gray-600 text-sm">Always provide truthful and accurate information in your listings and communications.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Respect Others</h4>
                  <p className="text-gray-600 text-sm">Treat other users with respect and avoid discriminatory or harassing behavior.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Account Security</h4>
                  <p className="text-gray-600 text-sm">Keep your account credentials secure and report any suspicious activity.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Stay Updated</h4>
                  <p className="text-gray-600 text-sm">Check these terms regularly as they may be updated from time to time.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Questions About These Terms?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              If you have any questions or concerns about these Terms & Conditions, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Contact Us
              </a>
              <a
                href="/privacy"
                className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                Privacy Policy
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Terms; 