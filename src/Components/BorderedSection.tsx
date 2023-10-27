import React from "react";
import SvgIcon from "@mui/material/SvgIcon";
import styles from "./BorederedSection.module.css";

import { ReactElement } from "react";
import { SvgIconTypeMap } from "@mui/material/SvgIcon";
import { OverridableComponent } from "@mui/material/OverridableComponent";

type BorderedSectionProps = {
  icon?: OverridableComponent<SvgIconTypeMap<{}, "svg">> & { props: { className?: string } };
  title?: string;
  children: React.ReactNode;
};

function BorderedSection({ icon, title, children }: BorderedSectionProps): JSX.Element {
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
            <div className={styles.childrenContainer}>{children}</div>
        </div>
    );
}

export default BorderedSection;
