"use client";

import { useOthersMapped } from "@liveblocks/react/suspense";
import { useUser, UserButton } from "@clerk/nextjs";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function CollaboratorAvatar({
  name,
  avatar,
  color,
}: {
  name: string;
  avatar: string;
  color: string;
}) {
  const avatarStyle = { "--avatar-ring": color } as React.CSSProperties;
  const initialsStyle = { "--initials-bg": color + "44" } as React.CSSProperties;

  return (
    <div className="presence-avatar" style={avatarStyle} title={name}>
      {avatar ? (
        <img src={avatar} alt={name} className="presence-avatar-img" />
      ) : (
        <div className="presence-avatar-initials" style={initialsStyle}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

export function PresenceAvatars() {
  const { user } = useUser();
  const others = useOthersMapped((other) => ({
    id: other.id,
    name: other.info.name,
    avatar: other.info.avatar,
    color: other.info.color,
  }));

  const collaborators = others.filter(([, o]) => o.id !== user?.id);
  const visible = collaborators.slice(0, 5);
  const overflow = Math.max(0, collaborators.length - 5);

  return (
    <div className="presence-group">
      {visible.map(([connectionId, o]) => (
        <CollaboratorAvatar
          key={connectionId}
          name={o.name}
          avatar={o.avatar}
          color={o.color}
        />
      ))}
      {overflow > 0 && (
        <div className="presence-overflow">+{overflow}</div>
      )}
      {collaborators.length > 0 && <div className="presence-divider" />}
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: { width: "28px", height: "28px" },
          },
        }}
      />
    </div>
  );
}
