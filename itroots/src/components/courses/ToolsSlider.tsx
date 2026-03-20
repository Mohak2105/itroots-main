'use client';

import React from 'react';
import Image from 'next/image';
import styles from './ToolsSlider.module.css';

interface Tool {
    name: string;
    icon: string;
}

interface ToolsSliderProps {
    tools: Tool[];
}

const ToolCard = ({ tool }: { tool: Tool }) => (
    <div className={styles.toolCard}>
        <div className={styles.toolIconWrapper}>
            <Image
                src={tool.icon}
                alt={tool.name}
                width={60}
                height={60}
                className={styles.toolIcon}
            />
        </div>
        <span className={styles.toolName}>{tool.name}</span>
    </div>
);

export const ToolsSlider: React.FC<ToolsSliderProps> = ({ tools }) => {
    // Slider logic for Mobile/Tablet
    const minItems = 20;
    let items = [...tools];
    while (items.length < minItems && items.length > 0) {
        items = [...items, ...tools];
    }
    const displayedTools = [...items, ...items, ...items];

    return (
        <div className={styles.container}>
            {/* Desktop Grid View */}
            <div className={styles.desktopGrid}>
                {tools.map((tool, index) => (
                    <ToolCard key={`desktop-${tool.name}-${index}`} tool={tool} />
                ))}
            </div>

            {/* Mobile/Tablet Slider View */}
            <div className={styles.mobileSlider}>
                <div className={styles.sliderTrack}>
                    {displayedTools.map((tool, index) => (
                        <ToolCard key={`mobile-${tool.name}-${index}`} tool={tool} />
                    ))}
                </div>
            </div>
        </div>
    );
};
