"use client";

import React from 'react';
import { Gravity, MatterBody } from './gravity';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolsGravityProps {
    tools: string[];
    toolIcons: Record<string, string>;
    className?: string;
}

export const ToolsGravity: React.FC<ToolsGravityProps> = ({ tools, toolIcons, className }) => {
    return (
        <div className={cn("relative w-full h-[400px] sm:h-[500px] overflow-hidden rounded-2xl bg-slate-50 border border-slate-200", className)}>
            <Gravity gravity={{ x: 0, y: 1 }} className="w-full h-full">
                {tools.map((tool, index) => {
                    const iconPath = toolIcons[tool] || toolIcons[Object.keys(toolIcons).find(k => tool.includes(k)) || ''];

                    // Randomize starting positions a bit
                    const xPos = `${20 + (Math.random() * 60)}%`;
                    const yPos = `${10 + (Math.random() * 20)}%`;
                    const angle = (Math.random() * 40) - 20;

                    return (
                        <MatterBody
                            key={`${tool}-${index}`}
                            matterBodyOptions={{ friction: 0.5, restitution: 0.2 }}
                            x={xPos}
                            y={yPos}
                            angle={angle}
                        >
                            <div className="flex items-center gap-4 px-10 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:cursor-grab active:cursor-grabbing transform transition-transform hover:scale-105">
                                {iconPath ? (
                                    <img
                                        src={iconPath}
                                        alt={tool}
                                        width="40"
                                        height="40"
                                        className="pointer-events-none"
                                    />
                                ) : (
                                    <Terminal size={32} className="text-slate-600 pointer-events-none" />
                                )}
                                <span className="text-xl font-bold text-slate-800 whitespace-nowrap pointer-events-none">{tool}</span>
                            </div>
                        </MatterBody>
                    );
                })}
            </Gravity>

            {/* Interaction Hint */}
        </div>
    );
};
