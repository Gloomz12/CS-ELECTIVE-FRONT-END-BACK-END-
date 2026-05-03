import React, { useState, useEffect } from "react";
import {Clock} from 'lucide-react';
import Time from "../hooks/time.jsx";

export default function LiveClock() {
    const time = Time();

    return (
        <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-4 py-1.5 rounded-full shadow-inner font-medium">
            <Clock size={16} className="text-teal-600" />
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
        </div>
    );
}