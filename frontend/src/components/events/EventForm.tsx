import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type {
  Event,
  EventCreatePayload,
  EventUpdatePayload,
} from "../../types/event";

type BaseEventFormProps = {
  initialEvent?: Event | null;
  submitting?: boolean;
  submitLabel?: string;
};

type CreateEventFormProps = BaseEventFormProps & {
  mode: "create";
  onSubmit: (payload: EventCreatePayload) => Promise<void> | void;
};

type EditEventFormProps = BaseEventFormProps & {
  mode: "edit";
  onSubmit: (payload: EventUpdatePayload) => Promise<void> | void;
};

type EventFormProps = CreateEventFormProps | EditEventFormProps;

type FormValues = {
  title: string;
  start_datetime: string;
  end_datetime: string;
  speaker_name: string;
  topic: string;
};

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoOrNull(value: string): string | null {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export default function EventForm(props: EventFormProps) {
  const { mode, initialEvent, submitting = false, submitLabel } = props;

  const initialValues = useMemo<FormValues>(
    () => ({
      title: initialEvent?.title ?? "",
      start_datetime: toDateTimeLocalValue(initialEvent?.start_datetime),
      end_datetime: toDateTimeLocalValue(initialEvent?.end_datetime),
      speaker_name: initialEvent?.speaker_name ?? "",
      topic: initialEvent?.topic ?? "",
    }),
    [initialEvent],
  );

  const [values, setValues] = useState<FormValues>(initialValues);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange =
    (field: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!values.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    const startIso = toIsoOrNull(values.start_datetime);
    if (!startIso) {
      setFormError("Start date and time are required.");
      return;
    }

    const endIso = toIsoOrNull(values.end_datetime);
    if (values.end_datetime.trim() && !endIso) {
      setFormError("End date and time is invalid.");
      return;
    }

    if (mode === "create") {
      const payload: EventCreatePayload = {
        title: values.title.trim(),
        start_datetime: startIso,
        end_datetime: endIso,
        speaker_name: values.speaker_name.trim() || null,
        topic: values.topic.trim() || null,
      };

      await props.onSubmit(payload);
      return;
    }

    const payload: EventUpdatePayload = {
      title: values.title.trim(),
      start_datetime: startIso,
      end_datetime: endIso,
      speaker_name: values.speaker_name.trim() || null,
      topic: values.topic.trim() || null,
    };

    await props.onSubmit(payload);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Typography variant="h6">
            {mode === "create" ? "Create event" : "Edit event"}
          </Typography>

          <TextField
            label="Title"
            value={values.title}
            onChange={handleChange("title")}
            required
            fullWidth
          />

          <TextField
            label="Start date and time"
            type="datetime-local"
            value={values.start_datetime}
            onChange={handleChange("start_datetime")}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
          />

          <TextField
            label="End date and time"
            type="datetime-local"
            value={values.end_datetime}
            onChange={handleChange("end_datetime")}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Speaker name"
            value={values.speaker_name}
            onChange={handleChange("speaker_name")}
            fullWidth
          />

          <TextField
            label="Topic"
            value={values.topic}
            onChange={handleChange("topic")}
            fullWidth
          />

          {formError && (
            <Typography color="error" variant="body2">
              {formError}
            </Typography>
          )}

          <Box>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting
                ? "Saving..."
                : submitLabel ?? (mode === "create" ? "Create event" : "Save changes")}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}