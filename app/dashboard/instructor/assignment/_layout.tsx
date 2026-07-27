'use client';

import { ReactNode } from 'react';

const AssignmentLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="assignment-layout">
            {children}
        </div>
    );
};

export default AssignmentLayout;