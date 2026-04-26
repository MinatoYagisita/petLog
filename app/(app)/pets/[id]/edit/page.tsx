"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageSpinner } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

const PET_TYPES = ["犬", "猫", "うさぎ", "鳥", "ハムスター", "その他"];

const GENDER_OPTIONS = [
  { value: "male", label: "オス" },
  { value: "female", label: "メス" },
  { value: "unknown", label: "不明" },
];
const SIZE_OPTIONS = [
  { value: "small", label: "小型" },
  { value: "medium", label: "中型" },
  { value: "large", label: "大型" },
];
const NEUTERED_OPTIONS = [
  { value: "true", label: "済み" },
  { value: "false", label: "未" },
  { value: "unknown", label: "不明" },
];

function ToggleGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <div className="flex rounded-xl border border-border overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2.5 text-sm transition-colors ${
              value === opt.value
                ? "bg-primary text-text-primary font-semibold"
                : "bg-surface text-text-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function compressToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 400;
      let { width, height } = img;
      if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
      else if (height > width && height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
      else if (width > maxSize) { height = maxSize; width = maxSize; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function toDateInput(isoStr: string | null): string {
  if (!isoStr) return "";
  return isoStr.split("T")[0];
}

export default function EditPetPage() {
  const { user } = useAuth();
  const { refresh } = usePets();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState(PET_TYPES[0]);
  const [gender, setGender] = useState("unknown");
  const [birthday, setBirthday] = useState("");
  const [size, setSize] = useState("medium");
  const [neutered, setNeutered] = useState("unknown");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<{
      id: string; name: string; type: string; gender: string | null;
      birthday: string | null; size: string | null; neutered: boolean | null;
      photoUrl: string | null;
    }>(`/api/pets/${id}`, user)
      .then((pet) => {
        setName(pet.name);
        setType(pet.type);
        setGender(pet.gender ?? "unknown");
        setBirthday(toDateInput(pet.birthday));
        setSize(pet.size ?? "medium");
        setNeutered(pet.neutered === null ? "unknown" : String(pet.neutered));
        setCurrentPhotoUrl(pet.photoUrl);
      })
      .catch(() => toast.error("読み込みに失敗しました"))
      .finally(() => setFetching(false));
  }, [user, id]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      let photoUrl = currentPhotoUrl;
      if (photoFile) {
        try {
          photoUrl = await compressToBase64(photoFile);
        } catch (e) {
          console.error("[photo]", e);
          toast.error("写真の保存に失敗しました");
        }
      }

      await api.patch(`/api/pets/${id}`, user, {
        name: name.trim(),
        type,
        gender: gender === "unknown" ? null : gender,
        birthday: birthday || null,
        size,
        neutered: neutered === "unknown" ? null : neutered === "true",
        photoUrl,
      });

      await refresh();
      toast.success("保存しました");
      router.push("/pets");
    } catch {
      toast.error("保存できませんでした");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <PageSpinner />;

  const displayPhoto = photoPreview ?? currentPhotoUrl;

  return (
    <div className="px-4 pt-6 flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary">
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-text-primary">ペット編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Photo */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-border bg-surface flex items-center justify-center"
          >
            {displayPhoto ? (
              <img src={displayPhoto} alt="pet photo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">🐾</span>
                <span className="text-[10px] text-text-secondary">写真を変更</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-1 opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-[10px]">変更</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <Card>
          <div className="flex flex-col gap-4">
            <Input
              label="ペットの名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ポチ"
              required
            />
            <Select
              label="種類"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              {PET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <ToggleGroup
              label="性別"
              value={gender}
              onChange={setGender}
              options={GENDER_OPTIONS}
            />
            <Input
              label="誕生日"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
            <ToggleGroup
              label="大きさ"
              value={size}
              onChange={setSize}
              options={SIZE_OPTIONS}
            />
            <ToggleGroup
              label="去勢・避妊"
              value={neutered}
              onChange={setNeutered}
              options={NEUTERED_OPTIONS}
            />
          </div>
        </Card>

        <Button type="submit" loading={loading} fullWidth>
          保存する
        </Button>
      </form>
    </div>
  );
}
