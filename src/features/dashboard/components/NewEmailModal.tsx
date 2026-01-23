import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, EnvelopeSimple, PaperPlaneRight, User, TextAa } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

interface EmailData {
    to: string;
    subject: string;
    body: string;
}

interface NewEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (emailData: EmailData) => void;
}

export const NewEmailModal: React.FC<NewEmailModalProps> = ({
    isOpen,
    onClose,
    onSend
}) => {
    const { t, language } = useAppContext();
    const isRTL = language === 'ar';
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTo('');
            setSubject('');
            setContent('');
        }
    }, [isOpen]);

    const handleSend = () => {
        if (!to.trim()) {
            alert(t('please_enter_recipient'));
            return;
        }
        if (!subject.trim()) {
            alert(t('please_enter_subject'));
            return;
        }

        const emailData = {
            to,
            subject,
            content,
            timestamp: new Date().toISOString()
        };

        onSend(emailData);
        onClose();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex justify-end bg-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white w-full max-w-[480px] h-full shadow-2xl overflow-hidden flex flex-col border-s border-gray-100"
                        initial={{ x: isRTL ? '-100%' : '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: isRTL ? '-100%' : '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form
                            className="flex flex-col h-full"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <EnvelopeSimple size={24} weight="duotone" className="text-blue-600" />
                                        {t('new_email')}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">{t('compose_new_message')}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

                                {/* To */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <User size={16} className="text-gray-400" />
                                        {t('to')}
                                    </label>
                                    <input
                                        autoFocus
                                        type="email"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                                        placeholder={t('recipient_placeholder')}
                                        value={to}
                                        onChange={e => setTo(e.target.value)}
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <TextAa size={16} className="text-gray-400" />
                                        {t('subject')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                        placeholder={t('enter_subject')}
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col h-full min-h-[300px]">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        {t('message')}
                                    </label>
                                    <textarea
                                        className="w-full h-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                                        placeholder={t('write_message')}
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                    />
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    {t('discard')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                                >
                                    <span>{t('send_email')}</span>
                                    <PaperPlaneRight size={16} weight="bold" />
                                </button>
                            </div>
                        </form>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
