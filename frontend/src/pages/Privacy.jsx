import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Shield, Eye, Lock, Users, Database, Bell } from 'lucide-react';

const Privacy = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content: `We collect information you provide directly to us, such as when you create an account, list a property, or contact us. This may include your name, email address, phone number, property details, and any other information you choose to provide. We also automatically collect certain information when you use our Platform, including your IP address, browser type, device information, and usage patterns.`
    },
    {
      title: "2. How We Use Your Information",
      content: `We use the information we collect to provide, maintain, and improve our services, communicate with you, process transactions, send you updates and marketing communications (with your consent), and ensure the security of our Platform. We may also use your information to comply with legal obligations and enforce our terms of service.`
    },
    {
      title: "3. Information Sharing and Disclosure",
      content: `We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information with service providers who assist us in operating our Platform, with law enforcement when required by law, and in connection with business transfers or mergers.`
    },
    {
      title: "4. Data Security",
      content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.`
    },
    {
      title: "5. Cookies and Tracking Technologies",
      content: `We use cookies and similar tracking technologies to enhance your experience on our Platform, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences, though disabling cookies may affect some Platform functionality.`
    },
    {
      title: "6. Third-Party Services",
      content: `Our Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.`
    },
    {
      title: "7. Your Rights and Choices",
      content: `You have the right to access, update, or delete your personal information. You can also opt out of marketing communications and control your privacy settings through your account dashboard. To exercise these rights, please contact us using the information provided below.`
    },
    {
      title: "8. Data Retention",
      content: `We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When we no longer need your information, we will securely delete or anonymize it.`
    },
    {
      title: "9. International Data Transfers",
      content: `Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.`
    },
    {
      title: "10. Children's Privacy",
      content: `Our Platform is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.`
    },
    {
      title: "11. Changes to This Policy",
      content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our Platform and updating the "Last Updated" date. Your continued use of our Platform after such changes constitutes acceptance of the updated policy.`
    },
    {
      title: "12. Contact Us",
      content: `If you have any questions about this Privacy Policy or our privacy practices, please contact us at Be.housemate@gmail.com or through our contact form on the Platform.`
    }
  ];

  const privacyFeatures = [
    {
      icon: Shield,
      title: "Data Protection",
      description: "Your personal information is protected with industry-standard security measures."
    },
    {
      icon: Eye,
      title: "Transparency",
      description: "We're transparent about how we collect, use, and share your information."
    },
    {
      icon: Lock,
      title: "Secure Storage",
      description: "Your data is stored securely using encryption and best practices."
    },
    {
      icon: Users,
      title: "User Control",
      description: "You have full control over your personal information and privacy settings."
    },
    {
      icon: Database,
      title: "Limited Collection",
      description: "We only collect information necessary to provide our services."
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "We'll notify you of any changes to our privacy practices."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Privacy Policy - Housemate</title>
        <meta name="description" content="Learn how Housemate protects your privacy and personal information. Read our comprehensive privacy policy to understand your rights and our data practices." />
        <meta name="keywords" content="privacy policy, data protection, Housemate, personal information, GDPR, privacy rights" />
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
                Privacy Policy
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Your privacy is important to us. Learn how we protect your information.
              </p>
              <p className="text-sm text-blue-200 mt-4">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Privacy Features Overview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Our Privacy Commitment
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {privacyFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-4"
                >
                  <feature.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Privacy Policy Content */}
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

          {/* Your Rights Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Your Privacy Rights
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Access Your Data</h4>
                <p className="text-gray-600 text-sm">Request a copy of all personal information we hold about you.</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Update Information</h4>
                <p className="text-gray-600 text-sm">Correct or update your personal information at any time.</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Delete Account</h4>
                <p className="text-gray-600 text-sm">Request deletion of your account and associated data.</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Opt Out</h4>
                <p className="text-gray-600 text-sm">Unsubscribe from marketing communications and data sharing.</p>
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
              Questions About Privacy?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              If you have any questions about our Privacy Policy or want to exercise your privacy rights, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Contact Us
              </a>
              <a
                href="mailto:Be.housemate@gmail.com"
                className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              >
                Email Privacy Team
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Privacy; 