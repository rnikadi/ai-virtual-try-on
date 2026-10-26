import type { RequiredPhoto } from "./api";

// What to photograph for each kind of try-on, shown before upload.
export const photoGuides: Record<RequiredPhoto, { label: string; tips: string[] }> = {
  full_body: {
    label: "Full-body photo",
    tips: ["Stand facing the camera", "Show head to at least the knees", "Plain background, good light"],
  },
  face: {
    label: "Face photo",
    tips: ["Look straight at the camera", "Hair away from your face", "Remove glasses, no filters"],
  },
  head_and_shoulders: {
    label: "Head-and-shoulders photo",
    tips: ["Face the camera", "Ears and neck visible", "Tuck hair behind your ears"],
  },
  hand: {
    label: "Hand photo",
    tips: ["Back of the hand toward the camera", "Fingers and wrist in frame", "Even light, plain surface"],
  },
  room: {
    label: "Room photo",
    tips: ["Shoot at eye level", "Wide enough to show the floor", "Leave the target spot visible"],
  },
};
