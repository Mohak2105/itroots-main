import { forwardRef, type CSSProperties } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";

type PhosphorWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

export type IconProps = LucideProps & {
    weight?: PhosphorWeight | string;
    mirrored?: boolean;
};

const resolveStrokeWidth = (weight?: string) => {
    switch (weight) {
        case "thin":
            return 1.2;
        case "light":
            return 1.6;
        case "duotone":
            return 1.8;
        case "bold":
            return 2.4;
        default:
            return 2;
    }
};

const withLucideCompat = (Icon: LucideIcon, displayName: string) => {
    const CompatIcon = forwardRef<SVGSVGElement, IconProps>(function CompatIcon(
        { size = 24, color = "currentColor", weight, mirrored = false, style, strokeWidth, ...props },
        ref,
    ) {
        const mergedStyle: CSSProperties = mirrored
            ? { transform: "scaleX(-1)", ...(style || {}) }
            : (style || {});

        return (
            <Icon
                ref={ref}
                size={size}
                color={color}
                strokeWidth={strokeWidth ?? resolveStrokeWidth(weight)}
                style={mergedStyle}
                {...props}
            />
        );
    });

    CompatIcon.displayName = displayName;
    return CompatIcon;
};

const iconMap = {
    ArrowLeft: LucideIcons.ArrowLeft,
    ArrowLineDown: LucideIcons.ArrowDownToLine,
    ArrowRight: LucideIcons.ArrowRight,
    ArrowSquareOut: LucideIcons.ExternalLink,
    ArrowsOutSimple: LucideIcons.Maximize,
    Bell: LucideIcons.Bell,
    BellRinging: LucideIcons.BellRing,
    BookOpen: LucideIcons.BookOpen,
    BookOpenText: LucideIcons.BookOpenText,
    BookmarkSimple: LucideIcons.Bookmark,
    Books: LucideIcons.BookCopy,
    Brain: LucideIcons.Brain,
    Briefcase: LucideIcons.Briefcase,
    Calendar: LucideIcons.Calendar,
    CalendarBlank: LucideIcons.Calendar,
    CalendarCheck: LucideIcons.CalendarCheck,
    CalendarDots: LucideIcons.CalendarDays,
    Camera: LucideIcons.Camera,
    CaretDown: LucideIcons.ChevronDown,
    CaretLeft: LucideIcons.ChevronLeft,
    CaretRight: LucideIcons.ChevronRight,
    Certificate: LucideIcons.BadgeCheck,
    Chalkboard: LucideIcons.Presentation,
    ChalkboardTeacher: LucideIcons.Presentation,
    ChartBar: LucideIcons.ChartBar,
    ChartLineUp: LucideIcons.TrendingUp,
    ChatCircleDots: LucideIcons.MessageCircleMore,
    Check: LucideIcons.Check,
    CheckCircle: LucideIcons.CheckCircle,
    CheckSquare: LucideIcons.CheckSquare,
    Circle: LucideIcons.Circle,
    CircleNotch: LucideIcons.LoaderCircle,
    Circuitry: LucideIcons.CircuitBoard,
    ClipboardText: LucideIcons.ClipboardList,
    Clock: LucideIcons.Clock,
    CloudArrowUp: LucideIcons.CloudUpload,
    Code: LucideIcons.Code,
    Coffee: LucideIcons.Coffee,
    Confetti: LucideIcons.PartyPopper,
    Cpu: LucideIcons.Cpu,
    CurrencyInr: LucideIcons.IndianRupee,
    Database: LucideIcons.Database,
    DownloadSimple: LucideIcons.Download,
    Envelope: LucideIcons.Mail,
    EnvelopeSimple: LucideIcons.Mail,
    Exam: LucideIcons.FileCheck,
    Eye: LucideIcons.Eye,
    EyeSlash: LucideIcons.EyeOff,
    File: LucideIcons.File,
    FilePdf: LucideIcons.FileText,
    FilePpt: LucideIcons.FileType2,
    FileText: LucideIcons.FileText,
    Fingerprint: LucideIcons.Fingerprint,
    FloppyDisk: LucideIcons.Save,
    Folder: LucideIcons.Folder,
    FolderOpen: LucideIcons.FolderOpen,
    Gear: LucideIcons.Settings,
    Globe: LucideIcons.Globe,
    GraduationCap: LucideIcons.GraduationCap,
    Handshake: LucideIcons.Handshake,
    Headset: LucideIcons.Headset,
    HourglassMedium: LucideIcons.Hourglass,
    ImageSquare: LucideIcons.Image,
    Laptop: LucideIcons.Laptop,
    Lightning: LucideIcons.Zap,
    Link: LucideIcons.Link,
    List: LucideIcons.List,
    Lock: LucideIcons.Lock,
    LockKey: LucideIcons.LockKeyhole,
    MagnifyingGlass: LucideIcons.Search,
    Megaphone: LucideIcons.Megaphone,
    MegaphoneSimple: LucideIcons.Megaphone,
    Monitor: LucideIcons.Monitor,
    MonitorPlay: LucideIcons.MonitorPlay,
    PaperPlaneRight: LucideIcons.Send,
    Paperclip: LucideIcons.Paperclip,
    PencilSimple: LucideIcons.Pencil,
    PencilSimpleLine: LucideIcons.Pencil,
    PlayCircle: LucideIcons.PlayCircle,
    Plus: LucideIcons.Plus,
    Power: LucideIcons.Power,
    Prohibit: LucideIcons.Ban,
    Question: LucideIcons.CircleHelp,
    Robot: LucideIcons.Bot,
    RocketLaunch: LucideIcons.Rocket,
    Scroll: LucideIcons.Scroll,
    SealCheck: LucideIcons.BadgeCheck,
    ShareNetwork: LucideIcons.Share2,
    ShieldCheck: LucideIcons.ShieldCheck,
    SignOut: LucideIcons.LogOut,
    Spinner: LucideIcons.LoaderCircle,
    SquaresFour: LucideIcons.LayoutGrid,
    Stack: LucideIcons.Layers,
    Student: LucideIcons.School,
    Tag: LucideIcons.Tag,
    Terminal: LucideIcons.Terminal,
    Timer: LucideIcons.Timer,
    Trash: LucideIcons.Trash,
    Tray: LucideIcons.Inbox,
    Trophy: LucideIcons.Trophy,
    UploadSimple: LucideIcons.Upload,
    User: LucideIcons.User,
    Users: LucideIcons.Users,
    UsersThree: LucideIcons.UsersRound,
    Video: LucideIcons.Video,
    VideoCamera: LucideIcons.Video,
    Warning: LucideIcons.TriangleAlert,
    WarningCircle: LucideIcons.AlertCircle,
    Wrench: LucideIcons.Wrench,
    X: LucideIcons.X,
} satisfies Record<string, LucideIcon>;

export const ArrowLeft = withLucideCompat(iconMap.ArrowLeft, "ArrowLeft");
export const ArrowLineDown = withLucideCompat(iconMap.ArrowLineDown, "ArrowLineDown");
export const ArrowRight = withLucideCompat(iconMap.ArrowRight, "ArrowRight");
export const ArrowSquareOut = withLucideCompat(iconMap.ArrowSquareOut, "ArrowSquareOut");
export const ArrowsOutSimple = withLucideCompat(iconMap.ArrowsOutSimple, "ArrowsOutSimple");
export const Bell = withLucideCompat(iconMap.Bell, "Bell");
export const BellRinging = withLucideCompat(iconMap.BellRinging, "BellRinging");
export const BookOpen = withLucideCompat(iconMap.BookOpen, "BookOpen");
export const BookOpenText = withLucideCompat(iconMap.BookOpenText, "BookOpenText");
export const BookmarkSimple = withLucideCompat(iconMap.BookmarkSimple, "BookmarkSimple");
export const Books = withLucideCompat(iconMap.Books, "Books");
export const Brain = withLucideCompat(iconMap.Brain, "Brain");
export const Briefcase = withLucideCompat(iconMap.Briefcase, "Briefcase");
export const Calendar = withLucideCompat(iconMap.Calendar, "Calendar");
export const CalendarBlank = withLucideCompat(iconMap.CalendarBlank, "CalendarBlank");
export const CalendarCheck = withLucideCompat(iconMap.CalendarCheck, "CalendarCheck");
export const CalendarDots = withLucideCompat(iconMap.CalendarDots, "CalendarDots");
export const Camera = withLucideCompat(iconMap.Camera, "Camera");
export const CaretDown = withLucideCompat(iconMap.CaretDown, "CaretDown");
export const CaretLeft = withLucideCompat(iconMap.CaretLeft, "CaretLeft");
export const CaretRight = withLucideCompat(iconMap.CaretRight, "CaretRight");
export const Certificate = withLucideCompat(iconMap.Certificate, "Certificate");
export const Chalkboard = withLucideCompat(iconMap.Chalkboard, "Chalkboard");
export const ChalkboardTeacher = withLucideCompat(iconMap.ChalkboardTeacher, "ChalkboardTeacher");
export const ChartBar = withLucideCompat(iconMap.ChartBar, "ChartBar");
export const ChartLineUp = withLucideCompat(iconMap.ChartLineUp, "ChartLineUp");
export const ChatCircleDots = withLucideCompat(iconMap.ChatCircleDots, "ChatCircleDots");
export const Check = withLucideCompat(iconMap.Check, "Check");
export const CheckCircle = withLucideCompat(iconMap.CheckCircle, "CheckCircle");
export const CheckSquare = withLucideCompat(iconMap.CheckSquare, "CheckSquare");
export const Circle = withLucideCompat(iconMap.Circle, "Circle");
export const CircleNotch = withLucideCompat(iconMap.CircleNotch, "CircleNotch");
export const Circuitry = withLucideCompat(iconMap.Circuitry, "Circuitry");
export const ClipboardText = withLucideCompat(iconMap.ClipboardText, "ClipboardText");
export const Clock = withLucideCompat(iconMap.Clock, "Clock");
export const CloudArrowUp = withLucideCompat(iconMap.CloudArrowUp, "CloudArrowUp");
export const Code = withLucideCompat(iconMap.Code, "Code");
export const Coffee = withLucideCompat(iconMap.Coffee, "Coffee");
export const Confetti = withLucideCompat(iconMap.Confetti, "Confetti");
export const Cpu = withLucideCompat(iconMap.Cpu, "Cpu");
export const CurrencyInr = withLucideCompat(iconMap.CurrencyInr, "CurrencyInr");
export const Database = withLucideCompat(iconMap.Database, "Database");
export const DownloadSimple = withLucideCompat(iconMap.DownloadSimple, "DownloadSimple");
export const Envelope = withLucideCompat(iconMap.Envelope, "Envelope");
export const EnvelopeSimple = withLucideCompat(iconMap.EnvelopeSimple, "EnvelopeSimple");
export const Exam = withLucideCompat(iconMap.Exam, "Exam");
export const Eye = withLucideCompat(iconMap.Eye, "Eye");
export const EyeSlash = withLucideCompat(iconMap.EyeSlash, "EyeSlash");
export const File = withLucideCompat(iconMap.File, "File");
export const FilePdf = withLucideCompat(iconMap.FilePdf, "FilePdf");
export const FilePpt = withLucideCompat(iconMap.FilePpt, "FilePpt");
export const FileText = withLucideCompat(iconMap.FileText, "FileText");
export const Fingerprint = withLucideCompat(iconMap.Fingerprint, "Fingerprint");
export const FloppyDisk = withLucideCompat(iconMap.FloppyDisk, "FloppyDisk");
export const Folder = withLucideCompat(iconMap.Folder, "Folder");
export const FolderOpen = withLucideCompat(iconMap.FolderOpen, "FolderOpen");
export const Gear = withLucideCompat(iconMap.Gear, "Gear");
export const Globe = withLucideCompat(iconMap.Globe, "Globe");
export const GraduationCap = withLucideCompat(iconMap.GraduationCap, "GraduationCap");
export const Handshake = withLucideCompat(iconMap.Handshake, "Handshake");
export const Headset = withLucideCompat(iconMap.Headset, "Headset");
export const HourglassMedium = withLucideCompat(iconMap.HourglassMedium, "HourglassMedium");
export const ImageSquare = withLucideCompat(iconMap.ImageSquare, "ImageSquare");
export const Laptop = withLucideCompat(iconMap.Laptop, "Laptop");
export const Lightning = withLucideCompat(iconMap.Lightning, "Lightning");
export const Link = withLucideCompat(iconMap.Link, "Link");
export const List = withLucideCompat(iconMap.List, "List");
export const Lock = withLucideCompat(iconMap.Lock, "Lock");
export const LockKey = withLucideCompat(iconMap.LockKey, "LockKey");
export const MagnifyingGlass = withLucideCompat(iconMap.MagnifyingGlass, "MagnifyingGlass");
export const Megaphone = withLucideCompat(iconMap.Megaphone, "Megaphone");
export const MegaphoneSimple = withLucideCompat(iconMap.MegaphoneSimple, "MegaphoneSimple");
export const Monitor = withLucideCompat(iconMap.Monitor, "Monitor");
export const MonitorPlay = withLucideCompat(iconMap.MonitorPlay, "MonitorPlay");
export const PaperPlaneRight = withLucideCompat(iconMap.PaperPlaneRight, "PaperPlaneRight");
export const Paperclip = withLucideCompat(iconMap.Paperclip, "Paperclip");
export const PencilSimple = withLucideCompat(iconMap.PencilSimple, "PencilSimple");
export const PencilSimpleLine = withLucideCompat(iconMap.PencilSimpleLine, "PencilSimpleLine");
export const PlayCircle = withLucideCompat(iconMap.PlayCircle, "PlayCircle");
export const Plus = withLucideCompat(iconMap.Plus, "Plus");
export const Power = withLucideCompat(iconMap.Power, "Power");
export const Prohibit = withLucideCompat(iconMap.Prohibit, "Prohibit");
export const Question = withLucideCompat(iconMap.Question, "Question");
export const Robot = withLucideCompat(iconMap.Robot, "Robot");
export const RocketLaunch = withLucideCompat(iconMap.RocketLaunch, "RocketLaunch");
export const Scroll = withLucideCompat(iconMap.Scroll, "Scroll");
export const SealCheck = withLucideCompat(iconMap.SealCheck, "SealCheck");
export const ShareNetwork = withLucideCompat(iconMap.ShareNetwork, "ShareNetwork");
export const ShieldCheck = withLucideCompat(iconMap.ShieldCheck, "ShieldCheck");
export const SignOut = withLucideCompat(iconMap.SignOut, "SignOut");
export const Spinner = withLucideCompat(iconMap.Spinner, "Spinner");
export const SquaresFour = withLucideCompat(iconMap.SquaresFour, "SquaresFour");
export const Stack = withLucideCompat(iconMap.Stack, "Stack");
export const Student = withLucideCompat(iconMap.Student, "Student");
export const Tag = withLucideCompat(iconMap.Tag, "Tag");
export const Terminal = withLucideCompat(iconMap.Terminal, "Terminal");
export const Timer = withLucideCompat(iconMap.Timer, "Timer");
export const Trash = withLucideCompat(iconMap.Trash, "Trash");
export const Tray = withLucideCompat(iconMap.Tray, "Tray");
export const Trophy = withLucideCompat(iconMap.Trophy, "Trophy");
export const UploadSimple = withLucideCompat(iconMap.UploadSimple, "UploadSimple");
export const User = withLucideCompat(iconMap.User, "User");
export const Users = withLucideCompat(iconMap.Users, "Users");
export const UsersThree = withLucideCompat(iconMap.UsersThree, "UsersThree");
export const Video = withLucideCompat(iconMap.Video, "Video");
export const VideoCamera = withLucideCompat(iconMap.VideoCamera, "VideoCamera");
export const Warning = withLucideCompat(iconMap.Warning, "Warning");
export const WarningCircle = withLucideCompat(iconMap.WarningCircle, "WarningCircle");
export const Wrench = withLucideCompat(iconMap.Wrench, "Wrench");
export const X = withLucideCompat(iconMap.X, "X");
