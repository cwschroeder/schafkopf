# Plan: Globales Scroll-Problem fixen

## Problem

Keine Seite scrollt in Safari (Browser-Modus, nicht PWA), weil `overflow-hidden` auf dem Body gesetzt ist.

**Root Cause:** `app/layout.tsx` Zeile 37:
```tsx
<body className="h-full min-h-dvh text-white overflow-hidden">
```

Das `overflow-hidden` verhindert global das Scrollen auf allen Seiten.

---

## Lösung

1. **`overflow-hidden` vom Body entfernen** in `layout.tsx`
2. **Scrollen nur dort blockieren wo nötig** (z.B. Spieltisch `/game/[id]`)

### Änderung in `app/layout.tsx`:

```tsx
// Vorher:
<body className="h-full min-h-dvh text-white overflow-hidden">

// Nachher:
<body className="h-full min-h-dvh text-white">
```

### Spieltisch (`/game/[id]`) separat handlen:

Der Spieltisch braucht `overflow-hidden` damit er nicht scrollt. Das sollte auf Page-Level passieren, nicht global.

In `app/game/[id]/page.tsx` oder `components/Table.tsx`:
```tsx
<div className="fixed inset-0 overflow-hidden">
  {/* Spieltisch-Inhalt */}
</div>
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `app/layout.tsx` | `overflow-hidden` entfernen |
| Evtl. `components/Table.tsx` | `overflow-hidden` auf Container-Level |

---

## Risiko

Gering - das Entfernen von `overflow-hidden` vom Body ist die korrekte Lösung. Seiten die nicht scrollen sollen (Spieltisch) müssen das selbst regeln.
