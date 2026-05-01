import React, { useState, useEffect } from "react";
import { Clock } from 'lucide-react';
import Time from "../hooks/time.jsx";

export default function LiveClock() {
    const time = Time();


    return (
        <div className="live-clock">
            <Clock size={16} className="text-teal-600" />
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    );
}