import SkillPill from '../components/SkillPill'
import SectionRule from '../components/SectionRule'
import { groupedSkills } from '../utils/skill-icons'
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
      </div>
    </section>
  )
}
