import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SkillPill from '../components/SkillPill'
import SectionRule from '../components/SectionRule'
import { groupedSkills } from '../utils/skill-icons'
import { SHOW_BLOG } from '../site'
import { PAGE, PAGE_TITLE } from './page-styles'

export default function Skills() {
  return (
    <section id="skills" className={PAGE}>
      <div className="w-full max-w-4xl">
        <h1 className={`${PAGE_TITLE} mb-10 md:mb-14`}>Skills</h1>

        <div className="flex flex-col gap-7 md:gap-9">
          {groupedSkills.map(group => (
            <div key={group.id}>
              <SectionRule label={group.label} count={group.items.length} />
              <div className="flex flex-wrap gap-2 md:gap-3">
                {group.items.map(skill => (
                  <SkillPill key={skill.name} skillName={skill.name} icon={skill.icon} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Hand-off from the one-page scroll to the blog, phrased as the
            branch switch it is: same repo, different history */}
        {SHOW_BLOG && (
          <div className="mt-16 flex justify-center md:mt-20">
            <Link
              to="/blog"
              className="group inline-flex items-center gap-2.5 rounded-lg border border-cream/20 bg-transparent px-5 py-2.5 font-mono text-[0.72rem] text-cream/70 no-underline transition-colors duration-[250ms] hover:border-cream/40 hover:bg-cream/[0.04] hover:text-cream"
            >
              <span className="text-signal-soft/70">$</span>
              git checkout blogs
              <ArrowRight
                className="size-3.5 transition-transform duration-[400ms] ease-out-expo group-hover:translate-x-1"
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
