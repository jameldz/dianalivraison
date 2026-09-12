var SAV_GROUPS = {
  envoi:{label:"Envoi Mondial Relay / Colissimo", color:"#C42A3F"},
  livreur:{label:"Livraison Marseille & sur place", color:"#B8651A"},
  paiement:{label:"Paiement", color:"#2F5FA8"},
  produit:{label:"Produit & retours", color:"#1E7F4A"},
  relation:{label:"Relation cliente", color:"#7A3E9D"}
};

var SAV_CASES = [
{id:"mail-mr",g:"envoi",t:"Pas de mail Mondial Relay / point non choisi",tags:"lien email spam relais locker choisi pas reçu attente expédition",
 lead:"Paiement reçu mais la cliente n'a pas choisi son Point Relais : rien ne peut partir tant qu'elle n'a pas cliqué sur le lien.",
 check:["Le paiement est bien encaissé (PayPal/Lydia) ?","L'email saisi sur la commande est correct ? (faute de frappe = mail jamais reçu)","Le lien a été généré et envoyé depuis Mondial Relay ?"],
 steps:["Demande-lui de vérifier <strong>spams / promotions / courrier indésirable</strong>.","Si l'email est faux : corrige-le et renvoie le lien.","Si toujours rien après 24 h : renvoie le lien ou fais le choix du point avec elle (elle t'envoie le nom du relais).","Pas de choix = pas d'expédition. Ne prépare pas le colis avant."],
 msgs:[
  {t:"Relance douce",m:"Coucou {prenom} ! Ton paiement est bien reçu ✅ Par contre je vois que tu n'as pas encore choisi ton point Mondial Relay 📦\n\nRegarde dans tes mails (y compris les spams) : tu as un lien perso pour choisir ton Point Relais ou Locker 🏪🔐\n\nDès que c'est fait, envoie-moi un petit message et ton colis part 🚀"},
  {t:"Email erroné",m:"Coucou {prenom} ! Le mail Mondial Relay est parti sur l'adresse que tu as mise sur la commande, mais elle semble incorrecte. Tu peux me confirmer ta bonne adresse email ? Je te renvoie le lien tout de suite 📧"}
 ],
 rule:"Sans choix de point relais, le colis ne part pas. C'est écrit sur la commande : le rappeler calmement, sans s'excuser."},

{id:"retard",g:"envoi",t:"Colis en retard / suivi bloqué",tags:"délai tracking suivi bloqué en transit pas bougé lent retard",
 lead:"Le suivi ne bouge plus ou la cliente trouve ça long. Distinguer un délai normal d'un vrai blocage.",
 check:["Date d'expédition réelle (dépôt en relais) ?","Dernier statut et date sur le suivi Mondial Relay ?","Point Relais, Locker ou domicile ? (domicile = retards fréquents)"],
 steps:["Jusqu'à <strong>5 jours ouvrés</strong> après dépôt : délai normal, rassure avec le lien de suivi.","Entre 5 et 8 jours ouvrés sans mouvement : préviens la cliente que tu surveilles, prépare la réclamation.","Au-delà de <strong>8 jours ouvrés</strong> sans mouvement : passe sur le cas « Colis perdu ».","Ne promets jamais une date : donne le statut du suivi, pas une estimation."],
 msgs:[
  {t:"Délai normal",m:"Coucou {prenom} ! J'ai regardé ton suivi : ton colis est bien en route 📦 Mondial Relay met en général 3 à 5 jours ouvrés, ça reste dans les délais. Tu recevras un SMS dès qu'il est au point relais 📱 Je surveille de mon côté 👀"},
  {t:"Suivi bloqué",m:"Coucou {prenom}, je vois comme toi que le suivi n'a pas bougé depuis quelques jours 😕 Ça arrive parfois avec un colis en attente dans un centre de tri. Je surveille et si rien n'a bougé d'ici {date}, j'ouvre une réclamation chez Mondial Relay. Je te tiens au courant 🙏"}
 ],
 rule:"Le suivi fait foi. On n'invente pas de date de livraison."},

{id:"perdu",g:"envoi",t:"Colis perdu",tags:"perdu disparu jamais arrivé réclamation indemnisation renvoi remboursement",
 lead:"Aucun mouvement depuis plus de 8 jours ouvrés ou Mondial Relay confirme la perte.",
 check:["Numéro de suivi, date de dépôt, valeur du colis (pour la réclamation).","Point choisi : relais/locker ou domicile ?","La cliente a-t-elle déjà contacté Mondial Relay de son côté ?"],
 steps:["Ouvre la <strong>réclamation Mondial Relay</strong> côté expéditeur (formulaire SAV : <strong>300 caractères max</strong>, va droit au but : n° de suivi, date dépôt, dernier statut, « aucun mouvement depuis X jours »).","Demande à la cliente d'ouvrir <strong>aussi</strong> une réclamation de son côté (réclamations parallèles : ça accélère).","<strong>Pas de renvoi</strong> tant que Mondial Relay n'a pas tranché. Tu l'expliques clairement, sans t'excuser pour le transporteur.","Perte confirmée / indemnisation : renvoi du colis ou remboursement, au choix de la cliente.","Note la date de chaque étape dans la fiche commande."],
 msgs:[
  {t:"Ouverture réclamation",m:"Coucou {prenom}, ton colis n'a plus de mouvement depuis trop longtemps, j'ai ouvert une réclamation chez Mondial Relay de mon côté 📋\n\nPour aller plus vite, fais-en une aussi de ton côté avec ton n° de suivi (sur le site Mondial Relay, rubrique réclamation). Les deux en parallèle, ça débloque beaucoup plus vite 💪\n\nDès que j'ai une réponse, je reviens vers toi. On ne renvoie pas de colis tant que Mondial Relay n'a pas statué, mais tu ne seras pas lésée 🙏"},
  {t:"Texte réclamation MR (≤300 car.)",m:"Colis n° {num} déposé le {date}. Aucun mouvement sur le suivi depuis plus de 8 jours ouvrés. Destinataire sans nouvelles. Merci de localiser le colis ou de confirmer la perte pour indemnisation."},
  {t:"Perte confirmée",m:"Coucou {prenom}, Mondial Relay a confirmé que ton colis est perdu 😔 Désolée pour l'attente. Deux options : je te renvoie ta commande (nouveau colis dès aujourd'hui) ou je te rembourse. Tu préfères quoi ?"}
 ],
 rule:"Réclamations en parallèle, aucun renvoi avant décision du transporteur. La cliente est informée à chaque étape."},

{id:"livre-non-recu",g:"envoi",t:"Marqué « livré » mais pas reçu",tags:"livré non reçu statut delivered pas trouvé relais locker code",
 lead:"Le suivi dit livré, la cliente dit non. Neuf fois sur dix le colis est au relais, chez un voisin ou dans un locker dont le code s'est perdu.",
 check:["Livré où ? Point Relais, Locker, domicile, gardien, voisin ?","La cliente a bien reçu le SMS/mail de mise à disposition ?","Nom du relais et horaires ?"],
 steps:["Point Relais : elle passe avec une <strong>pièce d'identité</strong> et le n° de colis. Le délai de garde est court : elle y va vite.","Locker : le code est dans le SMS/mail Mondial Relay ; si perdu, elle le redemande via le suivi.","Domicile : vérifier boîte aux lettres, voisins, gardien, puis lancer une réclamation « livré non reçu » chez Mondial Relay.","Si vraiment introuvable après 48 h : traiter comme « Colis perdu »."],
 msgs:[
  {t:"Vérification",m:"Coucou {prenom} ! Le suivi indique que ton colis est livré 📦 Peux-tu vérifier : ton point relais (avec ta pièce d'identité), ton locker (code dans le SMS Mondial Relay), et si c'était à domicile : boîte aux lettres, voisins, gardien 🙏 Dis-moi ce que tu trouves, je reste là 👀"},
  {t:"Toujours introuvable",m:"Ok {prenom}, si personne ne l'a, j'ouvre une réclamation « livré non reçu » chez Mondial Relay. Fais pareil de ton côté avec ton n° de suivi, ça accélère. Je te tiens au courant dès que j'ai du nouveau 💪"}
 ],
 rule:"D'abord chercher, ensuite réclamer. Ne pas renvoyer sur une simple parole."},

{id:"non-retire",g:"envoi",t:"Colis non retiré, retourné à l'expéditeur",tags:"retour expéditeur pas retiré délai dépassé renvoi frais à sa charge",
 lead:"La cliente n'est pas passée au relais à temps : le colis revient. Nouvel envoi à ses frais.",
 check:["Le SMS/mail de mise à disposition a bien été envoyé (visible dans le suivi) ?","Le colis est bien revenu (ou en cours de retour) ?"],
 steps:["Attends le retour physique du colis avant de renvoyer.","Propose le renvoi <strong>aux frais de la cliente</strong> (frais de port au tarif habituel), ou récupération sur place à Marseille.","Si elle refuse : remboursement du produit <strong>hors frais de port</strong>, une fois le colis revenu.","Nouvel envoi = nouveau lien Mondial Relay, mêmes règles."],
 msgs:[
  {t:"Colis retourné",m:"Coucou {prenom}, ton colis n'a pas été retiré à temps au point relais et il m'est retourné 📦↩️ Pas de panique : dès qu'il est revenu je peux te le renvoyer. Comme c'est un second envoi, les frais de port ({frais}) sont à ta charge (paiement Lydia ou PayPal). Tu me dis ? 🙏"}
 ],
 rule:"Erreur cliente ou transporteur = pas de renvoi gratuit. C'est indiqué sur la commande avant validation."},

{id:"domicile",g:"envoi",t:"Problème livraison à domicile Mondial Relay",tags:"domicile livreur absent avis de passage dépôt sans prévenir raté",
 lead:"Livraison manquée, colis déposé en relais sans prévenir, retard : les soucis classiques du domicile Mondial Relay.",
 check:["Statut exact du suivi : « livraison manquée », « déposé en relais », « retour » ?","Adresse complète et correcte sur la commande ?"],
 steps:["Regarde le suivi : souvent le colis a été <strong>redirigé vers un relais</strong> proche, il faut juste aller le chercher.","Si retour expéditeur : renvoi aux frais de la cliente (règle du site), en lui recommandant Point Relais ou Locker cette fois.","Réclamation Mondial Relay si le suivi est incohérent (livraison manquée alors qu'elle était présente)."],
 msgs:[
  {t:"Redirigé en relais",m:"Coucou {prenom} ! Le livreur n'a pas pu te remettre le colis à domicile, il a été déposé au point relais suivant : {relais} 🏪 Tu peux passer le récupérer avec ta pièce d'identité. Désolée pour ce détour, c'est pour ça qu'on recommande Point Relais ou Locker 😉"},
  {t:"Renvoi après retour",m:"Coucou {prenom}, ton colis m'est revenu suite à la livraison manquée à domicile 😕 Je peux te le renvoyer dès réception, les frais du second envoi ({frais}) sont à ta charge comme indiqué lors de la commande. Cette fois je te conseille vraiment Point Relais ou Locker, c'est bien plus fiable 🙏"}
 ],
 rule:"Chaque cas domicile est un argument de plus pour orienter vers relais/locker à la commande suivante."},

{id:"casse",g:"envoi",t:"Colis abîmé / produit cassé ou ouvert",tags:"cassé abîmé endommagé ouvert fuite écrasé photo",
 lead:"Le colis arrive écrasé, un pot est cassé, un sachet est ouvert. Il faut des preuves rapidement.",
 check:["Photos du carton (extérieur), de l'intérieur et du produit abîmé.","Elle a signalé le dommage au point relais / livreur au moment du retrait ?","Sous 48 h après réception ?"],
 steps:["Demande les <strong>photos avant toute autre chose</strong> (carton + produit).","Ouvre une réclamation Mondial Relay pour dommage avec les photos.","Renvoie le produit abîmé <strong>sans attendre la réponse du transporteur</strong> : c'est le seul cas où on renvoie tout de suite (la cliente n'y est pour rien et on a des preuves).","Note-le dans la commande pour le suivi de l'indemnisation."],
 msgs:[
  {t:"Demande de photos",m:"Oh non {prenom}, désolée 😔 Envoie-moi vite des photos : le carton (extérieur), l'intérieur et le produit abîmé, si possible aujourd'hui. Avec ça je fais la réclamation au transporteur et je m'occupe de toi 🙏"},
  {t:"Renvoi confirmé",m:"Merci pour les photos {prenom} 🙏 C'est clairement un souci de transport. Je te renvoie {produit} dès aujourd'hui, tu n'as rien à faire. Tu recevras un nouveau lien Mondial Relay 📦"}
 ],
 rule:"Photos sous 48 h, puis renvoi immédiat. Sans photos, pas de renvoi."},

{id:"manquant",g:"envoi",t:"Produit manquant ou erreur de produit",tags:"manque manquant erreur mauvais produit oubli inversion",
 lead:"Il manque un article ou ce n'est pas le bon.",
 check:["Compare avec la <strong>fiche commande</strong> (produits + quantités).","Photo de ce qu'elle a reçu.","Le colis était-il ouvert ou abîmé (alors → cas « Colis abîmé ») ?"],
 steps:["Si erreur de notre côté : renvoi de l'article manquant <strong>immédiat et gratuit</strong>, avec excuse simple.","Si c'est le mauvais produit : elle garde ou renvoie selon la valeur, tu envoies le bon.","Si la commande correspond à ce qu'elle a reçu : montre-lui la fiche, c'est elle qui s'est trompée → nouvelle commande normale."],
 msgs:[
  {t:"Erreur de notre côté",m:"Mince {prenom}, désolée pour l'oubli 🙏 Je t'envoie {produit} aujourd'hui, à mes frais bien sûr. Tu recevras le lien Mondial Relay par mail. Merci de ta patience ❤️"},
  {t:"Commande conforme",m:"Coucou {prenom}, j'ai revérifié ta commande #{num} : elle contenait {produits}, c'est bien ce qui a été envoyé 🙂 Si tu veux ajouter {produit}, je te fais une nouvelle commande avec les frais de port offerts pour te dépanner 😉"}
 ],
 rule:"Notre erreur = on répare vite et gratuitement. Son erreur = on aide, mais on ne paie pas."},

{id:"domtom",g:"envoi",t:"Outre-mer (Colissimo)",tags:"dom tom outre-mer guadeloupe martinique réunion colissimo douane la poste",
 lead:"Envoi hors métropole en Colissimo : délais plus longs et suivi La Poste, pas Mondial Relay.",
 check:["Numéro Colissimo et date de dépôt.","Délai écoulé (compter 7 à 10 jours ouvrés, plus en cas de contrôle douanier)."],
 steps:["Suivi sur laposte.fr avec le numéro Colissimo.","Réclamation Colissimo (espace La Poste) seulement après le délai annoncé dépassé.","Les mêmes règles que Mondial Relay s'appliquent : pas de renvoi avant décision."],
 msgs:[
  {t:"Délai outre-mer",m:"Coucou {prenom} ! Ton colis part en Colissimo Outre-mer 🌴 Compte 7 à 10 jours ouvrés, parfois un peu plus si passage en douane. Voici ton suivi : {suivi} Je surveille aussi de mon côté 👀"}
 ],
 rule:"Délai annoncé dès la commande, pas de promesse de date."},

{id:"livreur-retard",g:"livreur",t:"Livreur en retard / créneau raté",tags:"livreur retard créneau attend pas venu horaire marseille scooter",
 lead:"Livraison Marseille : la cliente attend, le livreur est en retard ou n'est pas passé sur le créneau.",
 check:["Le créneau confirmé sur la fiche commande (livraison possible <strong>après 14 h</strong>).","Le livreur a-t-il été notifié (onglet Notifié du dashboard) ?","Le livreur a essayé d'appeler ?"],
 steps:["Préviens la cliente <strong>avant</strong> qu'elle ne s'en plaigne dès que tu sais que le créneau glisse.","Donne une nouvelle fourchette réaliste, ou reprogramme au lendemain.","Si le retard vient de nous : offre la livraison (5 €) sur cette commande."],
 msgs:[
  {t:"Retard annoncé",m:"Coucou {prenom} ! Petit retard sur les livraisons aujourd'hui, le livreur passe plutôt vers {heure} 🛵 Désolée pour l'attente, tu es toujours dispo ? Sinon on cale un autre créneau 🙏"},
  {t:"Reprogrammation",m:"Coucou {prenom}, on n'a pas pu passer sur ton créneau aujourd'hui, désolée 😔 Je te propose demain, quel créneau après 14h t'arrange ? Et pour l'attente, la livraison est offerte sur cette commande 🎁"}
 ],
 rule:"On prévient avant, pas après. Un retard annoncé n'est presque jamais un problème."},

{id:"absente",g:"livreur",t:"Cliente absente / ne répond pas",tags:"absente répond pas injoignable porte sonne personne téléphone",
 lead:"Le livreur est devant chez elle et personne ne répond, ou elle ne confirme plus rien depuis la commande.",
 check:["Le livreur a appelé + envoyé un message WhatsApp ?","Deuxième numéro sur la fiche commande ?","C'est un paiement espèces (donc rien d'encaissé) ?"],
 steps:["Le livreur attend <strong>5 minutes max</strong>, appelle, laisse un message, repart.","Message à la cliente pour recaler un créneau.","Deuxième passage possible ; après 2 absences, la commande passe en <strong>récupération sur place</strong> ou est annulée.","Aucune relance agressive : elle n'a rien payé, rien n'est perdu."],
 msgs:[
  {t:"Passage manqué",m:"Coucou {prenom} ! Le livreur est passé vers {heure} mais pas de réponse 🛵 Pas de souci, dis-moi un nouveau créneau (après 14h) et on repasse 🙂"},
  {t:"Après 2 absences",m:"Coucou {prenom}, on est passés deux fois sans te trouver 😕 Pour ne pas bloquer le livreur, je te propose de récupérer ta commande sur place (Place Saint-Eugène, 13007) quand tu veux, ou de refaire une livraison quand tu es sûre d'être là. Tu me dis ?"}
 ],
 rule:"Deux passages max. Ensuite, récupération sur place."},

{id:"place",g:"livreur",t:"Récupération sur place : ne vient pas / cherche l'adresse",tags:"sur place rdv venue vient pas adresse saint eugène récupération",
 lead:"Elle a choisi la récupération sur place mais ne vient pas, ou ne trouve pas le point de rendez-vous.",
 check:["Créneau prévu sur la fiche ?","Elle a bien l'adresse : Caisse d'Épargne, Place Saint-Eugène, 13007 Marseille."],
 steps:["Renvoie l'adresse + un repère.","Si elle ne vient pas : la commande reste disponible, sans relance insistante. Une relance au bout d'une semaine, puis on laisse tomber.","Proposer la livraison (5 €) si elle n'arrive pas à se déplacer."],
 msgs:[
  {t:"Rappel adresse",m:"Coucou {prenom} ! Pour récupérer ta commande : devant la Caisse d'Épargne, Place Saint-Eugène, 13007 📍 Préviens-moi 10 min avant d'arriver et je descends 🙂 Paiement en espèces sur place 💵"},
  {t:"Relance semaine",m:"Coucou {prenom} ! Ta commande #{num} t'attend toujours 🙂 Tu veux passer la récupérer, ou je te la fais livrer (5 €) ? Comme tu préfères 🙏"}
 ],
 rule:"Pas de pression : rien n'est encaissé, la commande attend."},

{id:"paiement-non-recu",g:"paiement",t:"Paiement non reçu / « j'ai payé »",tags:"paiement pas reçu payé capture preuve paypal lydia virement en attente",
 lead:"La cliente dit avoir payé mais rien n'apparaît.",
 check:["Elle a payé sur le <strong>bon compte</strong> (PayPal / Lydia du bon vendeur : Sabra, Ilyes ou Syriane) ?","Montant exact ? Date/heure ?","Capture d'écran de sa transaction (nom du destinataire visible)."],
 steps:["Demande la <strong>capture avec le nom du destinataire</strong>.","Vérifie le compte du vendeur concerné (et les autres vendeurs, en cas de mauvais lien).","PayPal « en attente » : parfois 24 h de délai si paiement par carte ou compte non vérifié.","Rien trouvé nulle part : elle annule et refait, le colis part à réception."],
 msgs:[
  {t:"Demande de capture",m:"Coucou {prenom} ! Je ne vois pas encore ton paiement de mon côté 🤔 Tu peux m'envoyer une capture de ta transaction, avec le nom du destinataire visible ? Je vérifie tout de suite 🙏"},
  {t:"Paiement introuvable",m:"Merci {prenom} 🙏 Je ne retrouve pas ce paiement sur mon compte. Vérifie que tu as bien envoyé à {compte} et pas ailleurs. Si c'est parti sur un autre compte, tu peux annuler depuis ton appli et refaire le paiement : dès réception ton colis part 📦"}
 ],
 rule:"Pas de capture = pas d'expédition. Rien ne part avant l'argent sur le compte."},

{id:"paypal-frais",g:"paiement",t:"PayPal « biens et services » au lieu d'« entre proches »",tags:"paypal frais biens services proches commission montant inférieur",
 lead:"Elle a payé en « biens et services » : des frais sont retenus et le montant reçu est inférieur.",
 check:["Montant net reçu vs total commande.","Écart faible (frais PayPal) ou gros (mauvais montant) ?"],
 steps:["Écart de quelques centimes à 1-2 € : <strong>laisse passer</strong>, ne bloque pas une commande pour ça.","Écart plus important : demande le complément par Lydia ou PayPal proches.","Rappelle la consigne pour la prochaine fois, gentiment."],
 msgs:[
  {t:"Petit écart",m:"Coucou {prenom} ! Paiement reçu ✅ Petite info pour la prochaine fois : choisis « envoyer à un proche » sur PayPal, sinon des frais sont retenus 😉 Ton colis part, je t'envoie le lien Mondial Relay 📦"},
  {t:"Gros écart",m:"Coucou {prenom} ! J'ai bien reçu ton paiement mais en « biens et services », PayPal a retenu des frais : il me manque {montant} pour ta commande 😕 Tu peux m'envoyer le complément par Lydia ({lydia}) ou PayPal « entre proches » ? Dès que c'est bon, ton colis part 🚀"}
 ],
 rule:"On ne bloque pas une commande pour un euro. Au-delà, complément avant envoi."},

{id:"remboursement",g:"paiement",t:"Demande de remboursement / annulation",tags:"rembourser remboursement annuler annulation rétractation changé d'avis",
 lead:"Elle veut annuler ou se faire rembourser. La réponse dépend du moment.",
 check:["Colis déjà expédié ou pas ?","Produits ouverts ou scellés ?","Motif : changé d'avis, effet indésirable, pas de résultat, colis en retard ?"],
 steps:["<strong>Avant expédition</strong> : remboursement intégral, immédiat, sans discuter. Ça coûte moins qu'un litige.","<strong>Après expédition, produits scellés</strong> : retour possible sous 14 jours à ses frais, remboursement du produit hors frais de port à réception.","<strong>Produits ouverts</strong> : pas de reprise (hygiène / produits consommables). Proposer un geste sur la prochaine commande plutôt qu'un remboursement.","Rembourse toujours par le <strong>même moyen</strong> que le paiement."],
 msgs:[
  {t:"Avant expédition",m:"Pas de souci {prenom} 🙂 Ta commande n'est pas encore partie, je te rembourse intégralement par {moyen} aujourd'hui. Tu reviens quand tu veux 💛"},
  {t:"Après expédition, scellé",m:"Coucou {prenom}, je comprends 🙂 Tant que les produits sont scellés, tu peux me les retourner sous 14 jours (envoi à ta charge, à cette adresse : {adresse}). Dès réception je te rembourse le montant des produits par {moyen} 🙏"},
  {t:"Produit ouvert",m:"Coucou {prenom}, je comprends ta déception 🙏 Un produit entamé ne peut pas être repris (c'est un produit consommable), donc je ne peux pas le rembourser. Par contre je te fais {geste} sur ta prochaine commande, et je peux te conseiller pour l'utiliser au mieux si tu veux 💛"}
 ],
 rule:"Avant envoi : on rembourse. Scellé : retour à ses frais. Ouvert : geste commercial, pas de remboursement.",
 note:"Vente à distance : le droit de rétractation de 14 jours existe mais ne s'applique pas aux produits descellés pour raisons d'hygiène. À faire vérifier une fois par un pro pour figer les CGV du site."},

{id:"effets",g:"produit",t:"Effets indésirables / question santé",tags:"effet secondaire mal ventre nausée santé médecin enceinte allaite médicament interaction",
 lead:"Elle se plaint d'un effet (nausées, maux de ventre…) ou demande si elle peut prendre le produit avec un traitement, une grossesse, etc.",
 check:["Rien à diagnostiquer : ce n'est pas notre rôle.","Garder la <strong>trace écrite</strong> de l'échange."],
 steps:["Réponds avec empathie, <strong>sans avis médical</strong> : arrêter le produit et voir un médecin ou pharmacien.","Ne minimise pas, ne conseille pas de « réduire la dose ».","Grossesse, allaitement, traitement en cours : déconseiller l'usage et renvoyer vers le médecin.","Garde la conversation (capture) dans le dossier commande."],
 msgs:[
  {t:"Effet ressenti",m:"Coucou {prenom}, merci de m'avoir prévenue 🙏 Dans ce cas arrête le produit pour l'instant et parle-en à ton médecin ou pharmacien, c'est lui qui pourra te dire si c'est lié. Tiens-moi au courant, je suis là 💛"},
  {t:"Grossesse / traitement",m:"Coucou {prenom} ! Par précaution, nos produits ne sont pas conseillés pendant la grossesse, l'allaitement ou avec un traitement en cours. Le mieux est de demander l'avis de ton médecin avant de commencer 🙏"}
 ],
 rule:"Jamais d'avis médical. Redirection vers un professionnel, trace écrite conservée."},

{id:"resultats",g:"produit",t:"« Ça ne marche pas » / pas de résultats",tags:"résultat marche pas déçue efficace poids perdu rien",
 lead:"Elle est déçue, n'a pas perdu ce qu'elle espérait, ou n'a pas suivi le protocole.",
 check:["Depuis combien de temps ? À quelle fréquence ? Quel produit ?","Alimentation / hydratation pendant la cure ?"],
 steps:["Écoute d'abord, sans te justifier.","Rappelle le protocole d'utilisation et le délai réaliste.","Pas de remboursement pour absence de résultats (produit consommé). Propose un accompagnement ou une réduction sur la prochaine commande.","Ne promets jamais un chiffre de perte de poids."],
 msgs:[
  {t:"Réponse déception",m:"Coucou {prenom}, je comprends ta déception 🙏 Dis-moi comment tu l'as pris (depuis quand, à quel moment de la journée, combien d'eau dans la journée) pour que je puisse t'aider à ajuster. Les résultats varient selon les personnes et le rythme de vie, on va regarder ensemble ce qui peut être amélioré 💛"}
 ],
 rule:"Pas de promesse de résultat, pas de remboursement d'un produit consommé, mais un vrai suivi."},

{id:"colere",g:"relation",t:"Cliente en colère / menace d'avis négatif",tags:"colère énervée insulte avis négatif menace arnaque escroc signalement",
 lead:"Ton irrité, menaces d'avis, accusation d'arnaque. Le but : désamorcer, pas gagner.",
 check:["Quel est le vrai problème derrière (colis, argent, produit) ?","A-t-elle déjà eu une réponse ou est-elle sans nouvelles ?"],
 steps:["Réponds <strong>vite</strong> (le silence alimente la colère), calmement, une seule fois par message.","Reformule son problème, donne la prochaine étape concrète et une date.","Ne réponds jamais à la menace elle-même, ne te justifie pas longuement.","Si insultes : un message de cadrage, puis tu arrêtes de répondre aux insultes et tu ne traites que le dossier."],
 msgs:[
  {t:"Désamorçage",m:"{prenom}, je comprends que tu sois énervée et je suis là pour régler ça 🙏 Ton problème c'est {probleme}. Voilà ce que je fais : {action}, et je reviens vers toi au plus tard {date}. Tu peux compter sur moi."},
  {t:"Cadrage",m:"{prenom}, je veux vraiment t'aider mais on va rester correctes toutes les deux 🙂 Je m'occupe de ton dossier, je te réponds dès que j'ai du nouveau sur {action}."}
 ],
 rule:"Rapide, calme, concret. On traite le dossier, jamais la menace."},

{id:"suivi-sans-nouvelles",g:"relation",t:"Cliente sans nouvelles depuis sa commande",tags:"sans nouvelles silence relance confirmation pas de réponse fantôme",
 lead:"Commande passée mais ni paiement ni réponse (commande « fantôme » dans le dashboard).",
 check:["Mode de paiement choisi ?","Depuis combien de temps ?"],
 steps:["Relance J+1 avec les infos de paiement / le créneau.","Relance J+4, courte.","Après une semaine sans réponse : commande annulée dans le dashboard, sans message supplémentaire."],
 msgs:[
  {t:"Relance J+1",m:"Coucou {prenom} ! J'ai bien reçu ta commande #{num} 🙂 Il ne manque que ton paiement ({moyen}) pour que ton colis parte. Tu as tout ce qu'il faut ? Je suis là si besoin 🙏"},
  {t:"Relance J+4",m:"Coucou {prenom} ! Toujours partante pour ta commande #{num} ? Je la garde encore quelques jours, dis-moi 🙂"}
 ],
 rule:"Deux relances, puis on classe. Pas de troisième message."}
];


// ═══════════════════════════════════════════════════
//  DOSSIER SAV — historique par commande
//  Données : o.sav = { statut:'ouvert'|'resolu', type:'perdu', journal:[{t,txt}] }
//  Sauvegarde : saveStorage() (localStorage + sync cloud), comme les notes.
// ═══════════════════════════════════════════════════

function savFindOrder(id){
  try{ if(typeof orders!=='undefined') return orders.find(function(x){return x.id===id;})||null; }catch(e){}
  return null;
}
function savDossier(o){
  if(!o.sav) o.sav={statut:'ouvert',type:'',journal:[]};
  if(!o.sav.journal) o.sav.journal=[];
  return o.sav;
}
function savNbCommandes(o){
  if(!o) return 0;
  try{
    var tel=(o.tel||'').replace(/\s/g,'').replace(/^0/,'33').replace(/^\+/,'');
    var nom=(o.nom||'').toLowerCase().trim();
    return orders.filter(function(x){
      if(x.fantome||x.deletedAt) return false;
      var xt=(x.tel||'').replace(/\s/g,'').replace(/^0/,'33').replace(/^\+/,'');
      return (tel && xt===tel) || (nom && (x.nom||'').toLowerCase().trim()===nom);
    }).length;
  }catch(e){ return 0; }
}
function savPrenom(o){ return ((o&&o.nom)||'').trim().split(/\s+/)[0]||'cliente'; }
function savDateStr(ts){
  var d=new Date(ts);
  var p=function(n){return (n<10?'0':'')+n;};
  return p(d.getDate())+'/'+p(d.getMonth()+1)+' '+p(d.getHours())+'h'+p(d.getMinutes());
}
function savEsc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function savFill(msg,o){
  return String(msg).replace(/\{prenom\}/g,savPrenom(o)).replace(/\{num\}/g,(o&&o.num)||'');
}
// nombre de dossiers SAV encore ouverts
function savCountOuverts(){
  try{
    return orders.filter(function(o){ return o.sav && o.sav.journal && o.sav.journal.length && o.sav.statut!=='resolu' && !o.deletedAt; }).length;
  }catch(e){ return 0; }
}

// ─── Journal ───
async function savLog(id,txt){
  var o=savFindOrder(id); if(!o) return;
  var s=savDossier(o);
  s.journal.push({t:Date.now(),txt:txt});
  o.lastModified=Date.now();
  try{ await saveStorage(); }catch(e){}
  savRenderBody(id);
  try{ render(); }catch(e){}
}
async function savSetType(id,type){
  var o=savFindOrder(id); if(!o) return;
  var s=savDossier(o);
  if(s.type===type) return;
  s.type=type;
  var c=SAV_CASES.find(function(x){return x.id===type;});
  s.journal.push({t:Date.now(),txt:'Dossier ouvert — '+(c?c.t:type)});
  o.lastModified=Date.now();
  try{ await saveStorage(); }catch(e){}
  savRenderBody(id);
  try{ render(); }catch(e){}
}
async function savToggleStatut(id){
  var o=savFindOrder(id); if(!o) return;
  var s=savDossier(o);
  s.statut = s.statut==='resolu' ? 'ouvert' : 'resolu';
  s.journal.push({t:Date.now(),txt: s.statut==='resolu' ? '✅ Dossier clôturé' : '↩️ Dossier rouvert'});
  o.lastModified=Date.now();
  try{ await saveStorage(); }catch(e){}
  savRenderBody(id);
  try{ render(); }catch(e){}
  try{ toast(s.statut==='resolu'?'✅ Dossier SAV clôturé':'↩️ Dossier SAV rouvert'); }catch(e){}
}
async function savAddNote(id){
  var inp=document.getElementById('savNoteInput');
  var v=inp?inp.value.trim():'';
  if(!v){ try{toast('⚠️ Écris quelque chose');}catch(e){} return; }
  if(inp) inp.value='';
  await savLog(id,v);
}
async function savCopy(id,ci,mi){
  var o=savFindOrder(id); if(!o) return;
  var c=SAV_CASES.find(function(x){return x.id===ci}); if(!c) return;
  var m=c.msgs[mi]; if(!m) return;
  var txt=savFill(m.m,o);
  var done=function(){
    try{ toast('📋 Copié — colle-le sur Snap ou WhatsApp'); }catch(e){}
    savLog(id,'📤 Message envoyé : '+m.t);
  };
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done,function(){savCopyFallback(txt,done);}); }
    else savCopyFallback(txt,done);
  }catch(e){ savCopyFallback(txt,done); }
}
function savCopyFallback(txt,done){
  var ta=document.createElement('textarea');
  ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); done(); }catch(e){}
  document.body.removeChild(ta);
}
async function savWhatsApp(id,ci,mi){
  var o=savFindOrder(id); if(!o) return;
  var c=SAV_CASES.find(function(x){return x.id===ci}); if(!c) return;
  var m=c.msgs[mi]; if(!m) return;
  var tel=String(o.tel||'').replace(/\s/g,'').replace(/^0/,'33').replace(/^\+/,'');
  if(!tel){ try{toast('⚠️ Pas de téléphone sur cette commande');}catch(e){} return; }
  await savLog(id,'📤 Message envoyé (WhatsApp) : '+m.t);
  window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(savFill(m.m,o)),'_blank');
}

// ─── Modale ───
function openSAV(id){
  var o=savFindOrder(id);
  if(!o){ savOpenListe(); return; }
  savDossier(o);
  var old=document.getElementById('savModal'); if(old) old.remove();
  var m=document.createElement('div');
  m.id='savModal';
  m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding:0';
  m.innerHTML='<div id="savCard" style="background:#fff;width:100%;max-width:620px;max-height:92vh;border-radius:18px 18px 0 0;overflow:hidden;display:flex;flex-direction:column"></div>';
  m.addEventListener('click',function(e){ if(e.target===m) m.remove(); });
  document.body.appendChild(m);
  savRenderBody(id);
}
function savRenderBody(id){
  var card=document.getElementById('savCard'); if(!card) return;
  var o=savFindOrder(id); if(!o) return;
  var s=savDossier(o);
  var resolu=s.statut==='resolu';
  var c=s.type?SAV_CASES.find(function(x){return x.id===s.type;}):null;

  var head='<div style="background:linear-gradient(135deg,#C42A3F,#8E1B2C);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0">'
    +'<div style="font-size:22px">🛟</div>'
    +'<div style="flex:1;min-width:0">'
    +'<div style="font-size:16px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Dossier SAV — '+savEsc(o.nom||'')+'</div>'
    +'<div style="font-size:12px;opacity:.85">Commande #'+savEsc(o.num||'')+(c?' · '+savEsc(c.t):'')+'</div>'
    +(function(){var nb=savNbCommandes(o);return nb>1?'<div style="font-size:11px;font-weight:800;margin-top:2px;color:#FFE08A">⭐ Cliente fidèle — '+nb+' commandes</div>':'';})()
    +'</div>'
    +'<button onclick="document.getElementById(\'savModal\').remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;flex-shrink:0">✕</button>'
    +'</div>';

  // choix du problème
  var sel='<div style="padding:12px 16px 0">'
    +'<div style="font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B7280;margin-bottom:6px">Quel est le problème ?</div>'
    +'<select onchange="savSetType(\''+id+'\',this.value)" style="width:100%;padding:10px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:14px;font-weight:700;font-family:inherit;background:#fff">'
    +'<option value="">— Choisir —</option>';
  var gk=Object.keys(SAV_GROUPS);
  for(var i=0;i<gk.length;i++){
    var g=gk[i];
    sel+='<optgroup label="'+savEsc(SAV_GROUPS[g].label)+'">';
    SAV_CASES.filter(function(x){return x.g===g;}).forEach(function(x){
      sel+='<option value="'+x.id+'"'+(s.type===x.id?' selected':'')+'>'+savEsc(x.t)+'</option>';
    });
    sel+='</optgroup>';
  }
  sel+='</select></div>';

  // procédure + messages
  var proc='';
  if(c){
    proc='<div style="padding:14px 16px 0">'
      +'<div style="background:#FBF6F4;border-radius:12px;padding:12px 14px">'
      +'<div style="font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#C42A3F;margin-bottom:6px">Ce que tu fais</div>'
      +'<ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;color:#374151">'
      +c.steps.map(function(x){return '<li style="margin-bottom:4px">'+x+'</li>';}).join('')
      +'</ol>'
      +'<div style="margin-top:10px;padding-top:8px;border-top:1px solid #E7D9D5;font-size:12px;color:#8E1B2C;font-weight:700">⚖️ '+c.rule+'</div>'
      +'</div></div>'
      +'<div style="padding:14px 16px 0">'
      +'<div style="font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B7280;margin-bottom:6px">Messages prêts — copier ou envoyer</div>'
      +c.msgs.map(function(mm,idx){
        return '<div style="border:1px solid #E5E7EB;border-radius:12px;padding:10px 12px;margin-bottom:8px">'
          +'<div style="font-size:13px;font-weight:800;margin-bottom:5px">'+savEsc(mm.t)+'</div>'
          +'<div style="font-size:13px;line-height:1.5;color:#374151;white-space:pre-wrap;max-height:150px;overflow:auto;background:#F9FAFB;border-radius:8px;padding:8px">'+savEsc(savFill(mm.m,o))+'</div>'
          +'<div style="display:flex;gap:6px;margin-top:8px">'
          +'<button onclick="savCopy(\''+id+'\',\''+c.id+'\','+idx+')" style="flex:1;background:#F3F4F6;border:1px solid #E5E7EB;border-radius:8px;padding:8px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">📋 Copier</button>'
          +'<button onclick="savWhatsApp(\''+id+'\',\''+c.id+'\','+idx+')" style="flex:1;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;border:none;border-radius:8px;padding:8px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">💬 WhatsApp</button>'
          +'</div></div>';
      }).join('')
      +'<div style="font-size:11px;color:#9CA3AF">Les mots entre accolades ({date}, {frais}…) sont à remplacer avant d\'envoyer.</div>'
      +'</div>';
  }

  // journal
  var jr=s.journal.slice().sort(function(a,b){return b.t-a.t;});
  var journal='<div style="padding:14px 16px 0">'
    +'<div style="font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B7280;margin-bottom:6px">Historique ('+s.journal.length+')</div>'
    +'<div style="display:flex;gap:6px;margin-bottom:10px">'
    +'<input id="savNoteInput" type="text" placeholder="Ajouter au journal… (ex : réclamation MR ouverte)" onkeydown="if(event.key===\'Enter\')savAddNote(\''+id+'\')" style="flex:1;min-width:0;padding:9px 10px;border:1.5px solid #E5E7EB;border-radius:9px;font-size:13px;font-family:inherit">'
    +'<button onclick="savAddNote(\''+id+'\')" style="background:#C42A3F;color:#fff;border:none;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit">+</button>'
    +'</div>';
  if(!jr.length){
    journal+='<div style="font-size:13px;color:#9CA3AF;padding:6px 0 2px">Rien pour l\'instant. Choisis le problème ci-dessus, et chaque message envoyé sera noté ici automatiquement.</div>';
  } else {
    journal+='<div style="border-left:2px solid #E7D9D5;padding-left:12px;margin-left:4px">'
      +jr.map(function(e){
        return '<div style="margin-bottom:10px;position:relative">'
          +'<div style="position:absolute;left:-17px;top:5px;width:8px;height:8px;border-radius:50%;background:#C42A3F"></div>'
          +'<div style="font-size:11px;color:#9CA3AF;font-weight:700">'+savDateStr(e.t)+'</div>'
          +'<div style="font-size:13px;color:#374151;line-height:1.45">'+savEsc(e.txt)+'</div>'
          +'</div>';
      }).join('')
      +'</div>';
  }
  journal+='</div>';

  var foot='<div style="padding:12px 16px 16px;flex-shrink:0;border-top:1px solid #F3F4F6;background:#fff">'
    +'<button onclick="savToggleStatut(\''+id+'\')" style="width:100%;background:'+(resolu?'#F3F4F6':'linear-gradient(135deg,#16A34A,#15803D)')+';color:'+(resolu?'#374151':'#fff')+';border:'+(resolu?'1px solid #E5E7EB':'none')+';border-radius:10px;padding:12px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">'
    +(resolu?'↩️ Rouvrir le dossier':'✅ Marquer le dossier résolu')+'</button>'
    +'</div>';

  card.innerHTML=head
    +'<div style="overflow-y:auto;flex:1;padding-bottom:8px">'+sel+proc+journal+'</div>'
    +foot;
}

// ─── Liste des dossiers ouverts (bouton SAV du header) ───
function savOpenListe(){
  var old=document.getElementById('savModal'); if(old) old.remove();
  var ouverts=[];
  try{
    ouverts=orders.filter(function(o){ return o.sav && o.sav.journal && o.sav.journal.length && o.sav.statut!=='resolu' && !o.deletedAt; })
      .sort(function(a,b){ return (b.sav.journal[b.sav.journal.length-1].t)-(a.sav.journal[a.sav.journal.length-1].t); });
  }catch(e){}
  var m=document.createElement('div');
  m.id='savModal';
  m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  var body;
  if(!ouverts.length){
    body='<div style="padding:28px 20px;text-align:center;color:#6B7280;font-size:14px;line-height:1.6">Aucun dossier SAV ouvert 🎉<br><span style="font-size:13px;color:#9CA3AF">Pour en ouvrir un, clique sur 🛟 SAV sur la commande concernée.</span></div>';
  } else {
    body=ouverts.map(function(o){
      var last=o.sav.journal[o.sav.journal.length-1];
      var c=SAV_CASES.find(function(x){return x.id===o.sav.type;});
      return '<button onclick="openSAV(\''+o.id+'\')" style="display:block;width:100%;text-align:left;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:11px 13px;margin-bottom:8px;cursor:pointer;font-family:inherit">'
        +'<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">'
        +'<div style="font-size:14px;font-weight:800;color:#111827">'+savEsc(o.nom||'')+'</div>'
        +'<div style="font-size:11px;color:#9CA3AF;white-space:nowrap">'+savDateStr(last.t)+'</div></div>'
        +'<div style="font-size:12px;color:#C42A3F;font-weight:700;margin-top:2px">'+savEsc(c?c.t:'Problème non précisé')+'</div>'
        +'<div style="font-size:12px;color:#6B7280;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+savEsc(last.txt)+'</div>'
        +'</button>';
    }).join('');
  }
  m.innerHTML='<div style="background:#FBF6F4;width:100%;max-width:620px;max-height:88vh;border-radius:18px 18px 0 0;overflow:hidden;display:flex;flex-direction:column">'
    +'<div style="background:linear-gradient(135deg,#C42A3F,#8E1B2C);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px">'
    +'<div style="font-size:20px">🛟</div>'
    +'<div style="flex:1"><div style="font-size:16px;font-weight:900">Dossiers SAV ouverts</div>'
    +'<div style="font-size:12px;opacity:.85">'+ouverts.length+' en cours</div></div>'
    +'<button onclick="document.getElementById(\'savModal\').remove()" style="background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer">✕</button>'
    +'</div>'
    +'<div style="overflow-y:auto;padding:14px 16px 20px">'+body+'</div>'
    +'</div>';
  m.addEventListener('click',function(e){ if(e.target===m) m.remove(); });
  document.body.appendChild(m);
}
