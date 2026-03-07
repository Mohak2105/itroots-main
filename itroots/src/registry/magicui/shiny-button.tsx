import React from 'react';
import styles from './shiny-button.module.css';

type ShinyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ShinyButton({ className, ...props }: ShinyButtonProps) {
    const classes = [styles.shinyButton, className].filter(Boolean).join(' ');

    return <button {...props} className={classes} />;
}
