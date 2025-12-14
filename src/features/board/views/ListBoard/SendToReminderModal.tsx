import React from 'react';

export const SendToReminderModal: React.FC<any> = ({ onClose }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white p-6 rounded shadow-lg">
            <h2>Send to Reminder</h2>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Close</button>
        </div>
    </div>
);

export const remindersService = {
    sendTask: () => { }
};
