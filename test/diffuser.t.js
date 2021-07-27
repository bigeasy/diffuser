require('proof')(1, async okay => {
    const Destructible = require('destructible')
    const Diffuser = require('../sketch')
    const Compassion = require('compassion')
    const { Queue } = require('avenue')

    const destructible = new Destructible('test/diffuser.t')

    class UserAgent {
        async http () {
        }
        async tcp () {
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
        const address = await Compassion.listen(subDestructible.durable('compassion'), {
            census: census.shifter(),
            applications: { diffuser },
            bind: { host: '127.0.0.1', port: 0 }
        })
        diffusers.push({
            diffuser: diffuser,
            address: address
        })
        console.log(diffusers)
        census.push(diffusers.map(({ address: { port } }) => `http://127.0.0.1:${port}`))
    }
    okay(Diffuser, 'exists')
    await createDiffuser()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await destructible.destroy().promise
})
