import React from "react";
import SvgIcon from "@mui/material/SvgIcon";
import styles from "./BorderedSection.module.css";

import { SvgIconTypeMap } from "@mui/material/SvgIcon";
import { OverridableComponent } from "@mui/material/OverridableComponent";

type BorderedSectionProps = {
  icon?: OverridableComponent<SvgIconTypeMap<{}, "svg">> & { props: { className?: string } };
  title?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * React component to show a border section with optional title and icon embedded
 * into the border (similar to how MUI does a TextField)
 *
 * @param param0 Props.
 * @returns React component.
 */
function BorderedSection({ icon, title, style, children }: BorderedSectionProps): JSX.Element {
    return (
        <div className={styles.mainContainer}>
            <div className={styles.header}>
                <div className={styles.headerBorderBefore}></div>
                {(icon || title) && (
                    <div className={styles.headerTitle}>
                        {icon && <SvgIcon component={icon} />}
                        {title && <span className={styles.title}>{title}</span>}
                    </div>
                )}
                <div className={styles.headerBorderAfter}></div>
            </div>
            <div className={styles.childrenContainer} style={style}>{children}</div>
        </div>
    );
}

export default BorderedSection;
