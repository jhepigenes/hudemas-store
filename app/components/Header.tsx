'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import CampaignBanner from './CampaignBanner';

export default function Header() {
    // We need to coordinate the fixed positioning.
    // Ideally, we want the header to be fixed at the top.
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
            <CampaignBanner />
            <Navbar isFixed={false} /> {/* Pass prop to tell Navbar NOT to be fixed itself */}
        </header>
    );
}
