document.getElementById('testBtn').addEventListener('click', async () => {
    const eventId = document.getElementById('eventId').value.trim();
    const resultsDiv = document.getElementById('results');
    
    if (!eventId) {
        alert("Пожалуйста, введите ID события!");
        return;
    }

    resultsDiv.innerHTML = '<p>Отправляем 10 одновременных запросов...</p>';

    const url = `/api/v1/reservations`;

    const makeRequest = async () => {
        const idempotencyKey = crypto.randomUUID(); 
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Idempotency-Key': idempotencyKey
                },
                body: JSON.stringify({
                    event_id: eventId,
                    quantity: 1
                })
            });

            const data = await response.json();

            return {
                status: response.status,
                code: data.error ? data.error.code : 'SUCCESS',
                success: response.status === 201
            };
        } catch (e) {
            return { status: 'ERROR', code: 'NETWORK_ERROR', success: false };
        }
    };

    const promises = Array.from({ length: 10 }, () => makeRequest());
    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    let html = `<h3>Результаты:</h3>`;
    html += `<p class="success">✅ Успешно забронировано: ${successCount}</p>`;
    html += `<p class="fail">❌ Отклонено: ${failCount}</p>`;
    html += `<table><tr><th>Запрос</th><th>HTTP Статус</th><th>Код ошибки</th></tr>`;
    
    results.forEach((r, i) => {
        const color = r.success ? 'green' : 'red';
        html += `<tr style="color: ${color};">
            <td>Запрос ${i + 1}</td>
            <td>${r.status}</td>
            <td>${r.code}</td>
        </tr>`;
    });
    html += `</table>`;
    
    resultsDiv.innerHTML = html;
});
