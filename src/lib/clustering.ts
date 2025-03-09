interface Alert {
  description: string;
  hosts: Array<{ name: string }>;
  triggerid: string;
  lastchange: number;
  type?: string;
  tags?: {
    category: string;
    impact: string;
    service: string;
    resolution_hint: string;
  };
  dependencies?: string[];
  occurrence_count?: number;
  problem?: string; // Ajout du champ problem
}

interface Cluster {
  alerts: Alert[];
  similarity: number;
  category?: string;
  service?: string;
  impact?: string;
}

// Fonction pour calculer TF-IDF
function calculateTFIDF(documents: string[]): number[][] {
  // Calculer TF (Term Frequency)
  const wordFrequencies = documents.map(doc => {
    const text = doc || ''; // Gérer les documents undefined
    const words = text.toLowerCase().split(/\W+/);
    const freq: { [key: string]: number } = {};
    words.forEach(word => {
      if (word) { // Ignorer les mots vides
        freq[word] = (freq[word] || 0) + 1;
      }
    });
    return freq;
  });

  // Calculer IDF (Inverse Document Frequency)
  const wordIDF: { [key: string]: number } = {};
  const uniqueWords = new Set(documents.flatMap(doc => 
    (doc || '').toLowerCase().split(/\W+/).filter(word => word)
  ));

  uniqueWords.forEach(word => {
    const docsWithWord = documents.filter(doc => 
      (doc || '').toLowerCase().includes(word)
    ).length;
    wordIDF[word] = Math.log(documents.length / docsWithWord);
  });

  // Calculer les vecteurs TF-IDF
  return wordFrequencies.map(freq => {
    const vector: number[] = [];
    uniqueWords.forEach(word => {
      const tf = freq[word] || 0;
      const idf = wordIDF[word];
      vector.push(tf * idf);
    });
    return vector;
  });
}

// Fonction pour calculer la similarité cosinus
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length === 0 || vec2.length === 0) return 0;
  
  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (norm1 * norm2);
}

// Fonction pour calculer la similarité des tags
function calculateTagSimilarity(alert1: Alert, alert2: Alert): number {
  if (!alert1.tags || !alert2.tags) return 0;

  let score = 0;
  if (alert1.tags.category === alert2.tags.category) score += 0.3;
  if (alert1.tags.service === alert2.tags.service) score += 0.3;
  if (alert1.tags.impact === alert2.tags.impact) score += 0.2;

  // Vérifier les dépendances communes
  if (alert1.dependencies && alert2.dependencies) {
    const commonDeps = alert1.dependencies.filter(dep => alert2.dependencies?.includes(dep));
    score += (commonDeps.length / Math.max(alert1.dependencies.length, alert2.dependencies.length)) * 0.2;
  }

  return score;
}

// Fonction principale de clustering
export function clusterAlerts(alerts: Alert[]): Cluster[] {
  if (alerts.length === 0) return [];

  // Extraire les descriptions pour le calcul TF-IDF
  const descriptions = alerts.map(alert => alert.problem || alert.description || '');
  const vectors = calculateTFIDF(descriptions);

  // Initialiser les clusters
  const clusters: Cluster[] = [];
  const usedAlerts = new Set<string>();

  // Pour chaque alerte non assignée
  alerts.forEach((alert, i) => {
    if (usedAlerts.has(alert.triggerid)) return;

    const cluster: Cluster = {
      alerts: [alert],
      similarity: 1,
      category: alert.tags?.category,
      service: alert.tags?.service,
      impact: alert.tags?.impact
    };
    usedAlerts.add(alert.triggerid);

    // Chercher les alertes similaires
    alerts.forEach((otherAlert, j) => {
      if (i === j || usedAlerts.has(otherAlert.triggerid)) return;

      const textSimilarity = cosineSimilarity(vectors[i], vectors[j]);
      const tagSimilarity = calculateTagSimilarity(alert, otherAlert);
      const totalSimilarity = (textSimilarity * 0.6) + (tagSimilarity * 0.4);

      if (totalSimilarity > 0.5) { // Seuil de similarité
        cluster.alerts.push(otherAlert);
        cluster.similarity = totalSimilarity;
        usedAlerts.add(otherAlert.triggerid);
      }
    });

    if (cluster.alerts.length > 1) {
      clusters.push(cluster);
    }
  });

  // Ajouter les alertes isolées dans leurs propres clusters
  alerts.forEach(alert => {
    if (!usedAlerts.has(alert.triggerid)) {
      clusters.push({
        alerts: [alert],
        similarity: 1,
        category: alert.tags?.category,
        service: alert.tags?.service,
        impact: alert.tags?.impact
      });
    }
  });

  return clusters.sort((a, b) => {
    // Trier d'abord par impact
    const impactOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    const impactDiff = (impactOrder[a.impact as keyof typeof impactOrder] || 0) - 
                      (impactOrder[b.impact as keyof typeof impactOrder] || 0);
    if (impactDiff !== 0) return -impactDiff;

    // Puis par similarité
    return b.similarity - a.similarity;
  });
}