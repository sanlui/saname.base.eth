import React from 'react';
import { motion } from 'framer-motion';

const DeployIcon = () => (
    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <title>Deployment Icon</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    </div>
);

const OwnershipIcon = () => (
    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <title>Ownership Icon</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    </div>
);

const CostIcon = () => (
    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <title>Low Cost & Secure Icon</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
        </svg>
    </div>
);

const features = [
    { 
        icon: <DeployIcon />, 
        title: "Instant Deployment", 
        description: "Deploy your tokens in minutes. Our streamlined process removes complex steps, leveraging the speed of the Base network." 
    },
    { 
        icon: <OwnershipIcon />, 
        title: "Full Ownership", 
        description: "You control your token. We don't hold your keys or your contracts. Your creation, your rules." 
    },
    { 
        icon: <CostIcon />, 
        title: "Low-Cost & Secure", 
        description: "Built on Base for minimal gas fees. Deploy your secure, audited token with a simple and transparent one-time fee." 
    }
];

const Features: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-20">
        {features.map(feature => (
            <motion.div 
                key={feature.title} 
                className="bg-surface/70 border border-border rounded-2xl p-8 text-center flex flex-col items-center transition-all duration-300 hover:border-primary/50 hover:bg-surface"
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ duration: 0.2 }}
            >
                {feature.icon}
                <h3 className="text-xl font-bold text-text-primary mt-6 mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
            </motion.div>
        ))}
    </div>
);

export default Features;