"use client";

import {
  ArrowRight,
  BarChart2,
  Bell,
  Book,
  Globe,
  Menu,
  PieChart,
  Shield,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.section>
  );
};

const FeatureBox = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 40px rgba(59,130,246,0.3)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center h-full relative overflow-hidden"
    >
      <motion.div
        animate={{
          scale: isHovered ? 1.2 : 1,
          rotate: isHovered ? 360 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="text-blue-500 mb-4 relative z-10"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-2 text-white relative z-10">
        {title}
      </h3>
      <p className="text-gray-300 mb-4 flex-grow relative z-10">
        {description}
      </p>
      <motion.button
        whileHover={{ x: 5 }}
        className="mt-auto text-blue-500 flex items-center text-sm font-medium relative z-10"
      >
        Learn More <ArrowRight className="ml-1" size={16} />
      </motion.button>
      <motion.div
        className="absolute inset-0 bg-blue-600 opacity-0"
        animate={{ opacity: isHovered ? 0.1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default function DashboardLanding() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const tradingFeatures = [
    {
      icon: <Globe size={32} />,
      title: "Global Markets",
      description:
        "Access a wide range of simulated international markets from a single platform.",
    },
    {
      icon: <Zap size={32} />,
      title: "Real-time Data",
      description:
        "Practice with lightning-fast, random market data streams that feel like the real thing.",
    },
    {
      icon: <Shield size={32} />,
      title: "Secure & Risk-Free",
      description:
        "Learn to trade without risking real money, using our safe educational environment.",
    },
    {
      icon: <PieChart size={32} />,
      title: "Portfolio Analysis",
      description:
        "Analyze your simulated portfolio performance with professional-grade tools.",
    },
    {
      icon: <Bell size={32} />,
      title: "Price Alerts",
      description:
        "Experiment with alerts and notifications to never miss a simulated opportunity.",
    },
    {
      icon: <Book size={32} />,
      title: "Trading Education",
      description:
        "Enhance your skills with tutorials, pattern recognition, and strategy backtesting.",
    },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handlePrimaryCta = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  };

  const handleStartTrading = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-gray-900 min-h-screen font-sans text-white"
    >
      {/* Header like your TradePro home, but aware of auth */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-blue-500 cursor-pointer"
          onClick={() => router.push("/")}
        >
          ElevanceTrading
        </motion.div>
        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            {["Markets", "Trading", "Analysis", "Learn"].map(
              (item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <span className="text-gray-300 hover:text-blue-500 transition-colors cursor-pointer">
                    {item}
                  </span>
                </motion.li>
              )
            )}
          </ul>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {!loading && user && (
            <span className="text-sm text-gray-300">
              Hi, {user.email?.split("@")[0] || "Trader"}
            </span>
          )}
          {!loading && user && (
            <button
              onClick={logout}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          )}
          <motion.button
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors transform hover:scale-105"
            onClick={handleStartTrading}
          >
            Start Trading
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </header>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.6 }}
          className="md:hidden bg-gray-800 px-4 py-2"
        >
          <ul className="space-y-3">
            {["Markets", "Trading", "Analysis", "Learn"].map(
              (item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <span className="block text-gray-300 hover:text-blue-500 transition-colors py-2">
                    {item}
                  </span>
                </motion.li>
              )
            )}
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors transform hover:scale-105"
                onClick={handleStartTrading}
              >
                Start Trading
              </button>
            </motion.li>
          </ul>
        </motion.div>
      )}

      <main className="container mx-auto px-4">
        {/* Hero */}
        <AnimatedSection>
          <div className="text-center py-20">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl font-bold mb-6"
            >
              Trade Smarter, Not Harder
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl sm:text-2xl text-gray-400 mb-12"
            >
              Access simulated global markets with real-time data and
              advanced training tools.
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-blue-600 text-white px-8 py-4 rounded-md text-lg sm:text-xl hover:bg-blue-700 transition-colors flex items-center mx-auto"
              onClick={handlePrimaryCta}
            >
              {user ? "Go to Trading Workspace" : "Open Free Account"}
              <ArrowRight className="ml-2" />
            </motion.button>
          </div>
        </AnimatedSection>

        {/* Tools section */}
        <AnimatedSection>
          <div className="py-20">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-8">
                  Advanced Trading Tools
                </h2>
                <ul className="space-y-6">
                  {[
                    "Real-time simulated market data",
                    "Advanced multi‑asset charting",
                    "Risk management & P/L tracking",
                  ].map((item, index) => (
                    <motion.li
                      whileHover={{ scale: 1.05, color: "#3B82f6" }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      key={item}
                      className="flex items-center text-gray-300 text-lg"
                    >
                      <BarChart2 className="mr-4 text-blue-500" size={28} />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-gray-800 p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 relative overflow-hidden group"
              >
                <img
                  className="w-full rounded-xl"
                  src="https://i.ibb.co/C1jWyk9/1.jpg"
                  alt="Trading platform screenshot"
                />
                <motion.div
                  whileHover={{ opacity: 0.2 }}
                  className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                />
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* Analysis section */}
        <AnimatedSection>
          <div className="py-20">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-gray-800 p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 relative overflow-hidden group"
              >
                <img
                  src="https://i.ibb.co/0K3ZTzt/2.jpg"
                  alt="Market analysis feature"
                  className="w-full rounded-xl"
                />
                <motion.div
                  className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                  whileHover={{ opacity: 0.2 }}
                />
              </motion.div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-8">
                  Market Analysis at Your Fingertips
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                  Get in-depth analytics on simulated markets and make
                  better trading decisions before going live.
                </p>
                <motion.div
                  className="flex items-center bg-gray-800 p-6 rounded-xl relative overflow-hidden group"
                  whileHover={{ scale: 1.05 }}
                >
                  <TrendingUp
                    className="text-blue-500 mr-6 relative z-10"
                    size={48}
                  />
                  <div className="relative z-10">
                    <div className="text-4xl sm:text-5xl font-bold text-blue-500">
                      500+
                    </div>
                    <p className="text-gray-300 text-lg">
                      Simulated global markets to explore
                    </p>
                  </div>
                  <motion.div
                    className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    whileHover={{ opacity: 0.2 }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Why choose section */}
        <AnimatedSection>
          <div className="bg-gray-900 py-20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Why Choose ElevanceTrading?
                </h2>
                <p className="text-lg sm:text-xl text-gray-300">
                  Practice like a professional trader—without risking real
                  capital.
                </p>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-8">
                {tradingFeatures.map((feature, index) => (
                  <FeatureBox
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    delay={index * 0.1}
                  />
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* CTA footer */}
        <AnimatedSection>
          <div className="bg-blue-600 rounded-2xl p-12 text-center py-12 relative overflow-hidden group mb-16">
            <motion.div
              className="absolute inset-0 bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              whileHover={{ opacity: 1 }}
            />
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 relative z-10">
              Ready to Start Trading?
            </h2>
            <p className="text-lg sm:text-xl mb-8 relative z-10">
              Join thousands of learners and start your journey with a
              safe, simulated trading environment.
            </p>
            <motion.button
              className="bg-white text-blue-600 px-8 py-4 rounded-md text-lg sm:text-xl font-bold hover:bg-gray-100 transition-colors relative z-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrimaryCta}
            >
              {user ? "Go to Dashboard" : "Create Free Account"}
            </motion.button>
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
}