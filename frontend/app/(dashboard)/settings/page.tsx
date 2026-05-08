"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth";
import { useOrg } from "@/contexts/org";
import { request, orgsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ── Profile settings ──────────────────────────────────────────────────────────
function ProfileSettings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      await request("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName || null }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Profile updated.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email ?? ""}
              disabled
              className="text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// ── Org settings ──────────────────────────────────────────────────────────────
function OrgSettings() {
  const { activeOrg, setActiveOrg, refresh } = useOrg();
  const [name, setName] = useState(activeOrg?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = activeOrg?.role === "admin" || activeOrg?.role === "owner";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrg) return;
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const updated = await orgsApi.update(activeOrg.id, { name });
      setActiveOrg({ ...activeOrg, name: updated.name });
      await refresh();
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update organisation",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Organisation</CardTitle>
          <CardDescription>
            Update your organisation&apos;s details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Organisation updated.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              value={activeOrg?.slug ?? ""}
              disabled
              className="text-muted-foreground font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Slug cannot be changed after creation.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// ── Danger zone ───────────────────────────────────────────────────────────────
function DangerZone() {
  const { activeOrg, refresh } = useOrg();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (activeOrg?.role !== "owner") return null;

  async function handleDelete() {
    if (!activeOrg) return;
    const confirmed = confirm(
      `Are you sure you want to delete "${activeOrg.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    // Second confirmation
    const typed = prompt(
      `Type the organisation name "${activeOrg.name}" to confirm deletion:`,
    );
    if (typed !== activeOrg.name) {
      alert("Name did not match. Deletion cancelled.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await orgsApi.delete(activeOrg.id);
      await refresh();
      router.replace("/orgs/new");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete organisation",
      );
      setLoading(false);
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>
          Permanently delete this organisation and all its data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-sm text-muted-foreground">
          Deleting <strong>{activeOrg?.name}</strong> will remove all members,
          invites, and data. This action is irreversible.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? "Deleting…" : "Delete organisation"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and organisation settings.
        </p>
      </div>

      <ProfileSettings />
      <OrgSettings />
      <DangerZone />
    </div>
  );
}
