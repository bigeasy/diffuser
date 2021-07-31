require('proof')(6, async okay => {
    const url = require('url')
    const Destructible = require('destructible')
    const Diffuser = require('../sketch')
    const Compassion = require('compassion')
    const { Queue } = require('avenue')
    const axios = require('axios')

    const destructible = new Destructible('test/diffuser.t')

    class UserAgent {
        async post (url, body) {
            try {
                await axios.post(url, body)
                return 200
            } catch (error) {
                return error.response.status
            }
        }
        async http () {
            return 200
        }
        async tcp () {
            return 200
        }
    }
    const census = new Queue()
    destructible.destruct(() => census.push(null))
    const diffusers = []
    async function createDiffuser () {
        const subDestructible = destructible.ephemeral(`diffuser.${diffusers.length}`)
        const diffuser = new Diffuser(subDestructible.durable('diffuser'), { ua: new UserAgent })
        await diffuser.reactor.fastify.listen({ address: '127.0.0.1', port: 0 })
        destructible.destruct(() => destructible.ephemeral('close', () => diffuser.reactor.fastify.close()))
        const where = `http://127.0.0.1:${diffuser.reactor.fastify.server.address().port}/`
        diffuser.properties = { where }
        const address = await Compassion.listen(subDestructible.durable('compassion'), {
            census: census.shifter(),
            applications: { diffuser },
            bind: { host: '127.0.0.1', port: 0 }
        })
        diffusers.push({
            diffuser: diffuser,
            address: address,
            url: where
        })
        census.push(diffusers.map(({ address: { port } }) => `http://127.0.0.1:${port}`))
    }
    await createDiffuser()
    okay((await axios.get(diffusers[0].url)).data, 'Diffuser API\n', 'index')
    const statuses = []
    const options = {
        validateStatus: status => statuses.push(status)
    }
    const unready = [
        axios.get(url.resolve(diffusers[0].url, '/active'), options),
        axios.post(url.resolve(diffusers[0].url, '/receive'), { id: 'x', body: { a: 1 } }, options),
        axios.post(url.resolve(diffusers[0].url, '/send'), { id: 'x', body: { a: 1 } }, options),
    ]
    for (const promise of unready) {
        await promise
    }
    okay(statuses.splice(0), [ 503, 503, 503 ], 'not ready')
    await diffusers[0].diffuser.ready.promise
    console.log('WILL POAST')
    destructible.promise.catch(error => {
        console.log(error.stack)
    })
    {
        const result = await axios.get(url.resolve(diffusers[0].url, 'active'))
        okay(result.status, 200, 'active')
    }
    {
        const result = await axios.post(url.resolve(diffusers[0].url, '/receive'), {
            id: 'x', body: { a: 1 }
        })
        okay(result.status, 200, 'successful receive')
    }
    {
        const result = await axios.post(url.resolve(diffusers[0].url, '/send'), {
            id: 'x', body: { a: 1 }
        })
        okay(result.status, 200, 'successful send')
    }
    {
        await axios.post(url.resolve(diffusers[0].url, '/send'), {
            id: 'y', body: { a: 1 }
        }, options)
        okay(statuses.splice(0), [ 404 ], 'not found')
    }
    console.log('WILL DESTROY')
    await destructible.destroy().promise
})
