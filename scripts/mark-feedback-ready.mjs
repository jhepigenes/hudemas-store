const feedbackIds = [
    '1764657069577',
    '1764655850654',
    '1764655644083',
    '1764619879928',
    '1764619640484',
    '1764618869343',
    '1764616800541',
    '1764616343888',
    '1764616165547'
];

async function updateFeedback() {
    const url = 'https://hudemas-store.vercel.app/api/beta-feedback';
    
    try {
        const res = await fetch(url);
        const currentList = await res.json();
        
        if (!Array.isArray(currentList)) {
            console.error('Failed to fetch list');
            return;
        }

        const updatedList = currentList.map(item => {
            // If it was one of our targeted items OR if it's currently 'done', move it back to review
            // This ensures we catch them even if IDs match
            if (feedbackIds.includes(item.id) || item.status === 'done') {
                return { ...item, status: 'ready_for_review' };
            }
            return item;
        });

        const putRes = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(updatedList)
        });

        if (putRes.ok) {
            console.log('Successfully updated items to "ready_for_review".');
        } else {
            console.error('Failed to update:', await putRes.text());
        }

    } catch (e) {
        console.error(e);
    }
}

updateFeedback();
