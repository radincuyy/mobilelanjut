import { useEffect, useRef } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '../config/firebase';
import { configureNotifications, notifyIncomingChat } from '../services/notifications';

export function useChatNotifications(user) {
  const initializedRef = useRef(false);
  const notifiedIdsRef = useRef(new Set());

  useEffect(() => {
    if (!user?.uid) return undefined;

    configureNotifications().catch(() => {});

    const q = query(collection(db, 'messages'), where('receiverId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;

        const message = { id: change.doc.id, ...change.doc.data() };
        if (message.read || notifiedIdsRef.current.has(message.id)) return;

        notifiedIdsRef.current.add(message.id);

        if (!initializedRef.current) return;

        getDoc(doc(db, 'users', message.senderId))
          .then((senderDoc) => {
            const sender = senderDoc.exists() ? senderDoc.data() : {};
            return notifyIncomingChat({
              senderName: sender.name || sender.email || 'Teman',
              senderId: message.senderId,
              text: message.text,
            });
          })
          .catch(() => {});
      });

      initializedRef.current = true;
    });

    return () => {
      unsubscribe();
      initializedRef.current = false;
      notifiedIdsRef.current.clear();
    };
  }, [user?.uid]);
}
