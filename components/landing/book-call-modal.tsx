"use client";

import React from "react"

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";

interface BookCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  company?: string;
  telegram?: string;
}

export function BookCallModal({ open, onOpenChange }: BookCallModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [telegram, setTelegram] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Введите имя";
    if (!email.trim()) errs.email = "Введите email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Некорректный email";
    if (!company.trim()) errs.company = "Введите компанию";
    if (!telegram.trim()) errs.telegram = "Введите Telegram username";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      // Call FastAPI endpoint
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          company,
          telegram,
          source: 'landing_page',
        }),
      });

      if (!response.ok) {
        let detail = 'Request failed';
        try {
          const errorBody = await response.json();
          detail = errorBody.detail || detail;
        } catch { /* non-JSON error response */ }
        throw new Error(detail);
      }

      const data = await response.json();
      setLoading(false);
      setSuccess(true);

      // Optional: Track conversion
      console.log('Demo request submitted:', data);

    } catch (error) {
      setLoading(false);
      setErrors({ name: 'Произошла ошибка. Попробуйте ещё раз.' });
      console.error('Demo request error:', error);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      // Reset form after close
      setTimeout(() => {
        setName("");
        setEmail("");
        setCompany("");
        setTelegram("");
        setErrors({});
        setLoading(false);
        setSuccess(false);
      }, 300);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-border/60 bg-card text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-black">
            Оставьте заявку
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Оставьте контакты — мы свяжемся с вами в Telegram.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime/15">
              <CheckCircle className="h-7 w-7 text-lime" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Спасибо!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Мы напишем вам в Telegram в течение 24 часов.
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {"Если Telegram не открылся — напишите нам: "}
              <a
                href="https://t.me/IarslanT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lime underline"
              >
                @IarslanT
              </a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
            <div>
              <Label htmlFor="bc-name" className="text-sm text-muted-foreground">
                Имя
              </Label>
              <Input
                id="bc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Иванов"
                className="mt-1.5 border-border/60 bg-background text-white placeholder:text-muted-foreground/50"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bc-email" className="text-sm text-muted-foreground">
                Email
              </Label>
              <Input
                id="bc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ivan@company.ru"
                className="mt-1.5 border-border/60 bg-background text-white placeholder:text-muted-foreground/50"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bc-company" className="text-sm text-muted-foreground">
                Компания
              </Label>
              <Input
                id="bc-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="ООО Компания"
                className="mt-1.5 border-border/60 bg-background text-white placeholder:text-muted-foreground/50"
              />
              {errors.company && (
                <p className="mt-1 text-xs text-red-400">{errors.company}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bc-tg" className="text-sm text-muted-foreground">
                Telegram
              </Label>
              <Input
                id="bc-tg"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                className="mt-1.5 border-border/60 bg-background text-white placeholder:text-muted-foreground/50"
              />
              {errors.telegram && (
                <p className="mt-1 text-xs text-red-400">{errors.telegram}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-lime text-sm font-semibold text-lime-foreground hover:bg-lime/90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправляем...
                </>
              ) : (
                "Отправить"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
