import React, { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, Timestamp, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getApp } from "firebase/app";

const FirebaseDebug: React.FC = () => {
  useEffect(() => {
    // 1. Debug de autenticação
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("[FirebaseDebug] Usuário logado:", user.email);
        user.getIdToken().then((token) => {
          console.log("[FirebaseDebug] Token atual:", token);
        }).catch(error => {
          console.error("[FirebaseDebug] Erro ao obter token:", error);
        });
      } else {
        console.log("[FirebaseDebug] Usuário não autenticado");
      }
    });

    // 2. Forçar long polling (resolve timeout em redes restritivas)
    let db;
    try {
      db = initializeFirestore(getApp(), {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        experimentalForceLongPolling: true,
      });
      console.log("[FirebaseDebug] Firestore inicializado com long polling");
    } catch (e) {
      db = getFirestore(getApp());
      console.log("[FirebaseDebug] Firestore padrão inicializado");
    }

    // 3. Teste de escrita/leitura
    (async () => {
      try {
        const testDocRef = doc(db, "test_connection", "test_id");
        await setDoc(testDocRef, {
          message: "Teste de conexão",
          timestamp: Timestamp.now(),
        });
        console.log("[FirebaseDebug] Escrita no Firestore OK");
        const docSnap = await getDoc(testDocRef);
        if (docSnap.exists()) {
          console.log("[FirebaseDebug] Documento lido:", docSnap.data());
        } else {
          console.log("[FirebaseDebug] Documento não encontrado!");
        }
      } catch (error) {
        console.error("[FirebaseDebug] Erro Firestore:", error);
        if (error && error.code) {
          console.log("[FirebaseDebug] Código do erro:", error.code);
        }
        if (error && error.message) {
          console.log("[FirebaseDebug] Mensagem do erro:", error.message);
        }
      }
    })();
  }, []);

  return (
    <div style={{ background: '#eee', padding: 16, borderRadius: 8, margin: 16 }}>
      <strong>Firebase Debug</strong>
      <div style={{ fontSize: 12, color: '#555' }}>
        Veja o console do navegador para resultados detalhados.<br />
        (Este componente pode ser removido após o diagnóstico)
      </div>
    </div>
  );
};

export default FirebaseDebug;
