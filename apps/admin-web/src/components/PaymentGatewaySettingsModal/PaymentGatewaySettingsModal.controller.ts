import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export interface PaymentGatewaySettingsModalController {
  loading: boolean;
  saving: boolean;
  testing: boolean;
  testResult: { success: boolean; message: string } | null;
  saveSuccess: boolean;
  keyId: string;
  setKeyId: (val: string) => void;
  keySecret: string;
  setKeySecret: (val: string) => void;
  webhookSecret: string;
  setWebhookSecret: (val: string) => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  webhookUrl: string;
  showKeySecret: boolean;
  setShowKeySecret: (val: boolean | ((prev: boolean) => boolean)) => void;
  showWebhookSecret: boolean;
  setShowWebhookSecret: (val: boolean | ((prev: boolean) => boolean)) => void;
  copied: boolean;
  handleTest: () => Promise<void>;
  handleSave: (e: React.FormEvent) => Promise<void>;
  copyWebhookUrl: () => void;
}

export const usePaymentGatewaySettingsModalController = (
  isOpen: boolean
): PaymentGatewaySettingsModalController => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setTestResult(null);
    setSaveSuccess(false);
    try {
      const data = await api.getPaymentGatewaySettings();
      if (data) {
        setKeyId(data.keyId || '');
        setKeySecret('');
        setWebhookSecret('');
        setIsActive(data.isActive ?? true);
        setWebhookUrl(data.webhookCallbackUrl || '');
      }
    } catch (err) {
      console.warn('Could not load gateway settings, using empty defaults', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testPaymentGatewayConnection({
        gateway: 'RAZORPAY',
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId.trim()) {
      alert('Please enter your Razorpay Key ID');
      return;
    }
    if (!keySecret.trim()) {
      alert('Please enter your Razorpay Key Secret');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updatePaymentGatewaySettings({
        gateway: 'RAZORPAY',
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
        webhookSecret: webhookSecret.trim() || undefined,
        isActive,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert('Failed to save settings: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return {
    loading,
    saving,
    testing,
    testResult,
    saveSuccess,
    keyId,
    setKeyId,
    keySecret,
    setKeySecret,
    webhookSecret,
    setWebhookSecret,
    isActive,
    setIsActive,
    webhookUrl,
    showKeySecret,
    setShowKeySecret,
    showWebhookSecret,
    setShowWebhookSecret,
    copied,
    handleTest,
    handleSave,
    copyWebhookUrl,
  };
};
